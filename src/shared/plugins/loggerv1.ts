import fs from "node:fs";
import { request } from "node:http";
import os from "node:os";
import path from "node:path";
import type {
  FastifyInstance,
  FastifyLoggerOptions,
  FastifyReply,
  FastifyServerOptions,
  RawServerBase,
} from "fastify";
import type { PinoLoggerOptions } from "fastify/types/logger";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";
import pino from "pino";
import { createStream } from "rotating-file-stream";

// Tạo thư mục logs nếu chưa tồn tại
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Cấu hình rotating file stream cho general logs
const generalLogStream = createStream("general.log", {
  path: logsDir,
  size: "10M", // 10MB
  interval: "1d",
  compress: "gzip",
  maxFiles: 30,
});

// Cấu hình rotating file stream cho error logs
const errorLogStream = createStream("error.log", {
  path: logsDir,
  size: "10M",
  interval: "1d",
  compress: "gzip",
  maxFiles: 30,
});

// Cấu hình rotating file stream cho access logs
const accessLogStream = createStream("access.log", {
  path: logsDir,
  size: "10M",
  interval: "1d",
  compress: "gzip",
  maxFiles: 30,
});

const streams: pino.StreamEntry[] = [
  {
    level: "info",
    stream: process.stdout,
  },
  {
    level: "debug",
    stream: generalLogStream,
  },
  {
    level: "error",
    stream: errorLogStream,
  },
  {
    level: "info",
    stream: accessLogStream,
  },
];

export const pinoConfig: FastifyServerOptions["logger"] = {
  level: "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.headers["x-api-key"]',
      "req.headers.token",
      "password",
      "secret",
      "*.password",
      "*.token",
    ],
    censor: "[REDACTED]",
  }, // Custom serializers
  serializers: {
    req(request) {
      return {
        method: request.method,
        url: request.url,
        hostname: request.hostname,
        remoteAddress: request.ip,
        remotePort: request.socket?.remotePort,
        // WARNING: Don't log all headers in production (GDPR violation)
        // headers: request.headers,
      };
    },
    res(reply) {
      return {
        statusCode: reply.statusCode,
      };
    },
    err: pino.stdSerializers.err,
  },
  // Formatters
  formatters: {
    level: (label) => {
      return { level: label };
    },
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        hostname: bindings.hostname,
        node_version: process.version,
      };
    },
  },

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,

  // Base context (static fields)
  base: {
    // env: process.env.NODE_ENV,
    // service: "my-api-service",
    // version: process.env.APP_VERSION || "1.0.0",
    pid: process.pid,
    hostname: os.hostname(),
    // service: "fastify-app",
  },
  stream: pino.multistream(streams),
};

export const loggerHook = (fastify: FastifyInstance) => {
  // Hook để log tất cả requests
  fastify.addHook("onRequest", async (request, _) => {
    request.startTime = process.hrtime();

    request.log.info(
      {
        method: request.method,
        url: request.url,
        userAgent: request.headers["user-agent"],
        ip: request.ip,
        query: request.query,
        params: request.params,
      },
      "Incoming request"
    );
  });

  // Hook để log responses
  fastify.addHook("onResponse", async (request, reply: FastifyReply) => {
    const diff = process.hrtime(request.startTime);
    const responseTime = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2); // ms
    request.log.info(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: reply.getHeader("content-length"),
        ip: request.ip,
      },
      "Request completed"
    );
  });

  // Hook để log errors
  fastify.addHook("onError", async (request, _, error) => {
    if (hasZodFastifySchemaValidationErrors(error)) return;

    request.log.error(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          statusCode: error.statusCode || 500,
          validation: error.validation || null,
        },
        ip: request.ip,
      },
      "Request error"
    );
  });

  // Hook để log khi server ready
  fastify.addHook("onReady", async () => {
    fastify.log.info(
      {
        routes: fastify.printRoutes(),
        plugins: fastify.printPlugins(),
      },
      "Server ready - all routes and plugins loaded"
    );
  });

  // Hook để log khi server đóng
  fastify.addHook("onClose", async (request) => {
    request.log.info("Server closing - cleaning up resources");

    // Đóng các streams
    try {
      generalLogStream.end();
      errorLogStream.end();
      accessLogStream.end();
      //   routeLogStream.end();
    } catch (err) {
      request.log.error({ error: err }, "Error closing log streams");
    }
  });
};
