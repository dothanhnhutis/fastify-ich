import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import * as zlib from "zlib";
import { promisify } from "util";
import fp from "fastify-plugin";
import { Readable } from "stream";

// Promisify compression methods for async/await
const gzipAsync = promisify(zlib.gzip);
const brotliCompressAsync = promisify(zlib.brotliCompress);
const deflateAsync = promisify(zlib.deflate);

// Compression types
enum CompressionEnum {
  GZIP = "gzip",
  BROTLI = "br",
  DEFLATE = "deflate",
}

// Compression options interface
interface CompressionOptions {
  encoding: CompressionType[];
  threshold: number;
  level: CompressionLevel;
  brotliOptions: zlib.BrotliOptions;
  // global: boolean;
}

// Extend FastifyReply interface to include compress method
declare module "fastify" {
  interface FastifyReply {
    compress(payload: any, options?: CompressionOptions): Promise<FastifyReply>;
  }
}

type CompressionLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type CompressionType = "gzip" | "br" | "deflate";

type compressionT =
  | {
      method: "br";
      level: CompressionLevel;
      options: zlib.BrotliOptions;
    }
  | {
      method: "gzip";
      level: CompressionLevel;
      options: zlib.ZlibOptions;
    }
  | {
      method: "deflate";
      level: CompressionLevel;
      options: zlib.ZlibOptions;
    };

function compression(payload: unknown, configs: compressionT) {
  if (configs.method === "br") {
  } else if (configs.method === "gzip") {
    const stream = Readable.from(JSON.stringify(payload));
    return stream.pipe(
      zlib.createGzip({
        level: 6,
        ...configs.options,
      })
    );
  } else if (configs.method == "deflate") {
  } else {
    throw new Error("");
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

    // return { a: "ssdsd" };
  });

  fastify.get("/test1", async (req: FastifyRequest, reply: FastifyReply) => {
    const largeData = { data: "x".repeat(20_000_000) };
    // reply.header("Content-Encoding", "gzip");
    // reply.header("Content-Type", "application/json; charset=utf-8");
    // const stream = Readable.from(JSON.stringify(largeData));
    // return reply.send(stream.pipe(createGzip()));
    return reply.send(largeData);
  });

  // fastify.get("/big", async (req, reply) => {
  //   // Giả lập response lớn (chuỗi JSON dài)
  //   const largeData = JSON.stringify({ data: "x".repeat(5_000_000) });

  //   const encoder = getEncoder(req, reply);

  //   reply.header("Content-Type", "application/json; charset=utf-8");

  //   if (!encoder) {
  //     // Client không hỗ trợ nén → trả thẳng
  //     reply.send(largeData);
  //   } else {
  //     // 🚨 Báo cho Fastify: "Tôi sẽ tự quản lý response"
  //     reply.hijack();
  //     // Trả dữ liệu stream qua encoder
  //     encoder.pipe(reply.raw);
  //     encoder.end(largeData);
  //   }
  // });
};

export default fp(compressionPlugin, {
  name: "compressionPlugin",
});
