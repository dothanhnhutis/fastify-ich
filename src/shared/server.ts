import fs from "fs";
import path from "path";
import fastify, { FastifyReply, FastifyRequest } from "fastify";
import addErrors from "ajv-errors";
import addFormats from "ajv-formats";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import fastifyHelmet from "@fastify/helmet";
import fastifyMultipart from "@fastify/multipart";

import config from "./config";
import appRoutes from "../modules";
import logger from "./plugins/logger";
import redisPlugin from "./plugins/redis";
import rabbitMQPlugin from "./plugins/amqp";
import cookiePlugin from "./plugins/cookie";
import sessionPlugin from "./plugins/session";
import compressionPlugin from "./plugins/compression";
import { errorHandler } from "./error-handler";
import postgreSQLPlugin from "./plugins/postgres";

import zlib from "zlib";

function getEncoder(req: FastifyRequest, reply: FastifyReply) {
  const accept = req.headers["accept-encoding"] || "";
  if (/\bbr\b/.test(accept)) {
    reply.header("Content-Encoding", "br");
    return zlib.createBrotliCompress();
  } else if (/\bgzip\b/.test(accept)) {
    reply.header("Content-Encoding", "gzip");
    return zlib.createGzip();
  } else if (/\bdeflate\b/.test(accept)) {
    reply.header("Content-Encoding", "deflate");
    return zlib.createDeflate();
  } else {
    return null; // không nén
  }
}

export async function buildServer() {
  const server = fastify({
    logger: false,
    trustProxy: true,
    ajv: {
      customOptions: {
        allErrors: true,
        removeAdditional: true,
        $data: true,
        discriminator: true,
        coerceTypes: false,
      },
      plugins: [
        addFormats, // Thêm format validation (email, date, etc.)
        addErrors, // Thêm custom error messages
      ],
    },
  });

  // Plugins
  server.register(fastifyHelmet);
  server.register(compressionPlugin);
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
    setHeaders: (res, path, stat) => {
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
    // limits: {
    //   fieldNameSize: 100, // độ dài tối đa của tên field
    //   fieldSize: 100000, // kích thước tối đa của giá trị field (non-file)
    //   fields: 10, // số field không phải file tối đa
    //   fileSize: 5 * 1024 * 1024, // 5 MB cho mỗi file
    //   files: 5, // số file tối đa
    //   headerPairs: 2000, // header key=>value pairs
    //   parts: 10, // tổng parts = fields + files
    // },

    // Nếu attachFieldsToBody true thì các field + file được gắn vào req.body
    attachFieldsToBody: false, // true: khi muốn chuyển toàn bộ file upload và req.body và file không quá lớn.
    // Nếu muốn khi vượt giới hạn fileSize ném lỗi
    throwFileSizeLimit: true,
  });
  server.register(fastifyCors, {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });

  // server.get("/big", async (req, reply) => {
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

  await server
    .register(logger)
    .register(postgreSQLPlugin, {
      connectionString: config.DATABASE_URL,
      max: 100,
      idleTimeoutMillis: 30_000,
    })
    .register(redisPlugin, {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
    })
    .register(rabbitMQPlugin, {
      server: {
        username: config.RABBITMQ_USERNAME,
        password: config.RABBITMQ_PASSWORD,
        hostname: config.RABBITMQ_HOSTNAME,
        port: config.RABBITMQ_PORT,
        vhost: config.RABBITMQ_VHOST,
        frameMax: config.RABBITMQ_FRAME_MAX,
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
    secure: config.NODE_ENV === "production",
  });

  server.register(sessionPlugin, {
    secret: config.SESSION_SECRET_KEY,
    cookieName: config.SESSION_KEY_NAME,
    refreshCookie: true,
  });

  // Routes
  server.register(appRoutes, { prefix: "/api" });

  // Error handling
  server.setErrorHandler(errorHandler);

  return server;
}
