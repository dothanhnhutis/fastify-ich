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
  global?: boolean;
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

const compressionPlugin = async (fastify: FastifyInstance, options?: {}) => {
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

    reply.header("content-encoding", "11100");
    reply.header("vary", "Accept-Encoding");

    return { a: "ssdsd" };
  });
};

export default fp(compressionPlugin, {
  name: "compressionPlugin",
});
