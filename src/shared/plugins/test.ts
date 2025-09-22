import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import * as zlib from "zlib";
import { promisify } from "util";
import fp from "fastify-plugin";

// Promisify compression methods for async/await
const gzipAsync = promisify(zlib.gzip);
const brotliCompressAsync = promisify(zlib.brotliCompress);
const deflateAsync = promisify(zlib.deflate);

// Compression types
enum CompressionType {
  GZIP = "gzip",
  BROTLI = "br",
  DEFLATE = "deflate",
}

// Compression options interface
interface CompressionOptions {
  threshold?: number;
  level?: number;
  brotliOptions?: zlib.BrotliOptions;
}

// Extend FastifyReply interface to include compress method
declare module "fastify" {
  interface FastifyReply {
    compress(payload: any, options?: CompressionOptions): Promise<FastifyReply>;
  }
}

// Compression result interface
interface CompressionResult {
  data: Buffer;
  encoding: CompressionType;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

class CompressionHandler {
  private static readonly DEFAULT_THRESHOLD = 500;
  private static readonly DEFAULT_LEVEL = 6;

  /**
   * Get the best compression method based on Accept-Encoding header
   */
  private static getBestCompressionMethod(
    acceptEncoding: string
  ): CompressionType | null {
    const encoding = acceptEncoding.toLowerCase();

    // Priority: brotli > gzip > deflate
    if (encoding.includes("br")) {
      return CompressionType.BROTLI;
    } else if (encoding.includes("gzip")) {
      return CompressionType.GZIP;
    } else if (encoding.includes("deflate")) {
      return CompressionType.DEFLATE;
    }

    return null;
  }

  /**
   * Compress data using the specified method
   */
  private static async compressData(
    data: Buffer,
    method: CompressionType,
    options: CompressionOptions = {}
  ): Promise<Buffer> {
    const level = options.level || this.DEFAULT_LEVEL;

    switch (method) {
      case CompressionType.BROTLI:
        const brotliOptions: zlib.BrotliOptions = {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: level,
            [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length,
          },
          ...options.brotliOptions,
        };
        return await brotliCompressAsync(data, brotliOptions);

      case CompressionType.GZIP:
        return await gzipAsync(data, { level });

      case CompressionType.DEFLATE:
        return await deflateAsync(data, { level });

      default:
        throw new Error(`Unsupported compression method: ${method}`);
    }
  }

  /**
   * Serialize payload to buffer
   */
  private static serializePayload(payload: any): {
    data: Buffer;
    contentType: string;
  } {
    let data: Buffer;
    let contentType: string;

    if (Buffer.isBuffer(payload)) {
      data = payload;
      contentType = "application/octet-stream";
    } else if (typeof payload === "string") {
      data = Buffer.from(payload, "utf8");
      contentType = "text/plain; charset=utf-8";
    } else if (typeof payload === "object") {
      const jsonString = JSON.stringify(payload);
      data = Buffer.from(jsonString, "utf8");
      contentType = "application/json; charset=utf-8";
    } else {
      const stringified = String(payload);
      data = Buffer.from(stringified, "utf8");
      contentType = "text/plain; charset=utf-8";
    }

    return { data, contentType };
  }

  /**
   * Main compression method
   */
  public static async compress(
    reply: FastifyReply,
    payload: any,
    options: CompressionOptions = {}
  ): Promise<FastifyReply> {
    try {
      const threshold = options.threshold || this.DEFAULT_THRESHOLD;
      const request = reply.request as FastifyRequest;
      const acceptEncoding = request.headers["accept-encoding"] || "";

      // Check if compression is supported
      const compressionMethod = this.getBestCompressionMethod(acceptEncoding);
      if (!compressionMethod) {
        return reply.send(payload);
      }

      // Serialize payload
      const { data, contentType } = this.serializePayload(payload);
      const originalSize = data.length;

      // Check if payload is large enough to compress
      if (originalSize < threshold) {
        return reply.type(contentType).send(payload);
      }

      // Compress data
      const compressedData = await this.compressData(
        data,
        compressionMethod,
        options
      );
      const compressedSize = compressedData.length;

      // Only use compression if it actually reduces size
      if (compressedSize >= originalSize) {
        return reply.type(contentType).send(payload);
      }

      // Calculate compression ratio
      const compressionRatio =
        ((originalSize - compressedSize) / originalSize) * 100;

      // Set compression headers
      reply.header("content-encoding", compressionMethod);
      reply.header("vary", "Accept-Encoding");
      reply.header("x-original-size", originalSize.toString());
      reply.header("x-compressed-size", compressedSize.toString());
      reply.header("x-compression-ratio", compressionRatio.toFixed(2) + "%");

      // Set content type and send compressed data
      return reply.type(contentType).send(compressedData);
    } catch (error: any) {
      // Log error and fallback to uncompressed response
      reply.log.error("Compression failed:", error);
      return reply.send(payload);
    }
  }
}

// Plugin to add compression functionality
const compressionPlugin = async (fastify: FastifyInstance) => {
  // Decorate reply with compress method
  fastify.decorateReply(
    "compress",
    async function (
      this: FastifyReply,
      payload: any,
      options?: CompressionOptions
    ): Promise<FastifyReply> {
      return CompressionHandler.compress(this, payload, options);
    }
  );

  // Add hook to automatically compress large responses
  fastify.addHook("preSerialization", async (request, reply, payload) => {
    const acceptEncoding = request.headers["accept-encoding"] || "";
    // Skip if no compression support or already compressed
    if (!acceptEncoding || reply.getHeader("content-encoding")) {
      return payload;
    }

    // Skip for certain content types that shouldn't be compressed
    const contentType = (reply.getHeader("content-type") as string) || "";
    const skipCompression = [
      "image/",
      "video/",
      "audio/",
      "application/zip",
      "application/gzip",
      "application/x-rar",
    ].some((type) => contentType.includes(type));

    if (skipCompression) {
      return payload;
    }

    const jsonString = JSON.stringify(payload);
    const data = Buffer.from(jsonString, "utf8");
    // const contentType = "application/json; charset=utf-8";

    try {
      // Auto-compress if payload is large enough
      const { data } = CompressionHandler["serializePayload"](payload);
      console.log(data.length);

      if (data.length > 500) {
        // Use the compress method but don't send, just modify headers and return compressed data
        const compressionMethod =
          CompressionHandler["getBestCompressionMethod"](acceptEncoding);

        if (compressionMethod) {
          const compressedData = await CompressionHandler["compressData"](
            data,
            compressionMethod
          );

          if (compressedData.length < data.length) {
            reply.header("content-encoding", compressionMethod);
            reply.header("vary", "Accept-Encoding");
            return compressedData;
          }
        }
      }
    } catch (error: any) {
      fastify.log.error("Auto-compression failed:", error);
    }

    reply.header("content-encoding", "11100");
    reply.header("vary", "Accept-Encoding");

    return { a: "ssdsd" };
  });

  // Add hook to automatically compress large responses
  // fastify.addHook("preSerialization", async (request, reply, payload) => {
  //   const acceptEncoding = request.headers["accept-encoding"] || "";

  //   // Skip if no compression support or already compressed
  //   if (!acceptEncoding || reply.getHeader("content-encoding")) {
  //     return payload;
  //   }

  //   // Skip for certain content types that shouldn't be compressed
  //   const contentType = (reply.getHeader("content-type") as string) || "";
  //   const skipCompression = [
  //     "image/",
  //     "video/",
  //     "audio/",
  //     "application/zip",
  //     "application/gzip",
  //     "application/x-rar",
  //   ].some((type) => contentType.includes(type));

  //   if (skipCompression) {
  //     return payload;
  //   }

  //   try {
  //     // Auto-compress if payload is large enough
  //     const { data } = CompressionHandler["serializePayload"](payload);
  //     if (data.length > 1024) {
  //       // Use the compress method but don't send, just modify headers and return compressed data
  //       const compressionMethod =
  //         CompressionHandler["getBestCompressionMethod"](acceptEncoding);
  //       if (compressionMethod) {
  //         const compressedData = await CompressionHandler["compressData"](
  //           data,
  //           compressionMethod
  //         );

  //         if (compressedData.length < data.length) {
  //           reply.header("content-encoding", compressionMethod);
  //           reply.header("vary", "Accept-Encoding");
  //           return compressedData;
  //         }
  //       }
  //     }
  //   } catch (error: any) {
  //     fastify.log.error("Auto-compression failed:", error);
  //   }

  //   return payload;
  // });
};

export default fp(compressionPlugin, {
  name: "compressionPlugin",
});
