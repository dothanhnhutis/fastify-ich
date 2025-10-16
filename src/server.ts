import path from "node:path";
// import { Readable } from "node:stream";
// import { createGzip } from "node:zlib";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import rabbitMQPlugin from "@shared/plugins/amqp";
import cookiePlugin from "@shared/plugins/cookie";
import logger from "@shared/plugins/logger";
import postgreSQLPlugin from "@shared/plugins/postgres";
import redisPlugin from "@shared/plugins/redis";
import sessionPlugin from "@shared/plugins/session";

import { errorHandler } from "@shared/utils/error-handler";
// import addErrors from "ajv-errors";
// import addFormats from "ajv-formats";
import fastify from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import appRoutes from "./modules";
import env from "./shared/config/env";

// function getEncoder(req: FastifyRequest, reply: FastifyReply) {
//   const accept = req.headers["accept-encoding"] || "";
//   if (/\bbr\b/.test(accept)) {
//     reply.header("Content-Encoding", "br");
//     return zlib.createBrotliCompress();
//   } else if (/\bgzip\b/.test(accept)) {
//     reply.header("Content-Encoding", "gzip");
//     return zlib.createGzip();
//   } else if (/\bdeflate\b/.test(accept)) {
//     reply.header("Content-Encoding", "deflate");
//     return zlib.createDeflate();
//   } else {
//     return null; // không nén
//   }
// }

export async function buildServer() {
  const server = fastify({
    logger: false,
    trustProxy: true,
    // ajv: {
    //   customOptions: {
    //     allErrors: true,
    //     removeAdditional: true,
    //     $data: true,
    //     discriminator: true,
    //     coerceTypes: "array",
    //   },
    //   plugins: [
    //     addFormats, // Thêm format validation (email, date, etc.)
    //     addErrors, // Thêm custom error messages
    //   ],
    // },
  });

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);
  server.withTypeProvider<ZodTypeProvider>();

  // Plugins
  server.register(fastifyHelmet);
  // server.register(compressionPlugin);
  server.register(fastifyStatic, {
    root: [path.join(__dirname, "public")],
    prefix: "/static/",
    prefixAvoidTrailingSlash: true, // Tránh trailing slash
    maxAge: "7 days", // Cache control
    etag: true, // Enable ETag
    lastModified: true, // Enable Last-Modified header
    immutable: true,

    // serve: true, // If true, serves files in hidden directories

    // Chỉ serve certain file types
    acceptRanges: true, // Support range requests

    // Custom decorators
    decorateReply: false, // Không thêm reply.sendFile

    // Constraints (optional)
    constraints: {},

    // Custom error handler
    setHeaders: (res, path) => {
      // Custom headers cho mỗi file
      if (path.endsWith(".jpg") || path.endsWith(".png")) {
        res.setHeader("X-File-Type", "image");
      }
    },

    // Redirect to trailing slash
    redirect: false,

    // Wildcard support
    wildcard: true,
  });

  server.register(fastifyMultipart, {
    // cấu hình global tối đa
    // ở middleware có cấu hình thấp hơn
    limits: {
      fieldNameSize: 100, // độ dài tối đa của tên field
      fieldSize: 2 * 1024 * 1024, // kích thước tối đa của giá trị field (non-file)
      fields: 100, // số field không phải file tối đa
      fileSize: 10 * 1024 * 1024, // 5 MB cho mỗi file
      files: 15, // số file tối đa
      headerPairs: 2000, // header key=>value pairs
      parts: 1000, // tổng parts = fields + files
    },

    // Nếu attachFieldsToBody true thì các field + file được gắn vào req.body
    attachFieldsToBody: false, // true: khi muốn chuyển toàn bộ file upload và req.body và file không quá lớn.
    // Nếu muốn khi vượt giới hạn fileSize ném lỗi
    throwFileSizeLimit: true,
  });

  server.register(fastifyCors, {
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });

  await server
    .register(logger)
    .register(postgreSQLPlugin, {
      connectionString: env.DATABASE_URL,
      max: 100,
      idleTimeoutMillis: 30_000,
    })
    .register(redisPlugin, {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    })
    .register(rabbitMQPlugin, {
      server: {
        username: env.RABBITMQ_USERNAME,
        password: env.RABBITMQ_PASSWORD,
        hostname: env.RABBITMQ_HOSTNAME,
        port: env.RABBITMQ_PORT,
        vhost: env.RABBITMQ_VHOST,
        frameMax: env.RABBITMQ_FRAME_MAX,
      },
      connections: [
        {
          name: "publisher-conn",
          channels: [
            {
              name: "publish-user-channel",
            },
          ],
          maxRetries: 10,
          retryDelay: 5000,
          clientProperties: {
            connection_name: "publisher-conn",
            purpose: "publisher",
          },
        },
        {
          name: "consumer-conn",
          channels: [
            {
              name: "consume-user-channel",
            },
          ],
          maxRetries: 10,
          retryDelay: 5000,
          clientProperties: {
            connection_name: "consumer-conn",
            purpose: "consumer",
          },
        },
      ],
      exchanges: [
        {
          name: "user-mail-direct",
          type: "direct",
          options: {
            durable: true,
          },
        },
      ],
      queues: [
        {
          type: "direct",
          name: "create-new-user-mail-queue",
          exchange: "user-mail-direct",
          routingKey: "create-new-user",
          options: { durable: true },
        },
      ],
    });

  server.register(cookiePlugin, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
  });

  server.register(sessionPlugin, {
    secret: env.SESSION_SECRET_KEY,
    cookieName: env.SESSION_KEY_NAME,
    refreshCookie: true,
  });

  // Routes
  server.register(appRoutes, { prefix: "/api" });

  // Error handling
  server.setErrorHandler(errorHandler);

  return server;
}
