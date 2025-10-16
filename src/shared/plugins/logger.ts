import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  RouteOptions,
} from "fastify";
import fp from "fastify-plugin";
import pino, { type Level, type Logger } from "pino";
import { createStream } from "rotating-file-stream";

declare module "fastify" {
  interface FastifyInstance {
    logger: Logger;
    routeLogger: Logger;
  }

  interface FastifyRequest {
    logger: Logger;
    startTime: [number, number];
  }
}

export interface LoggerOptions {
  level?: Level;
  serviceName?: string;
}

async function logger(
  fastify: FastifyInstance,
  options: LoggerOptions & FastifyPluginOptions
): Promise<void> {
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

  // Cấu hình rotating file stream cho route logs
  const routeLogStream = createStream("routes.log", {
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

  // Route logger riêng biệt
  const routeLogger = pino(
    {
      level: "info",
      timestamp: () => `,"time":"${new Date().toISOString()}"`,
      formatters: {
        level: (label: string) => ({ level: label }),
      },
      base: {
        pid: process.pid,
        hostname: os.hostname(),
        service: `${options.serviceName || "fastify-app"}-routes`,
      },
    },
    routeLogStream
  );

  // Tạo logger với multiple streams
  const logger = pino(
    {
      level: "info",
      timestamp: () => `,"time":"${new Date().toISOString()}"`,
      formatters: {
        level: (label: string) => {
          return { level: label };
        },
      },
      serializers: {
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        err: pino.stdSerializers.err,
      },
      base: {
        pid: process.pid,
        hostname: os.hostname(),
        service: options.serviceName || "fastify-app",
      },
    },
    pino.multistream(streams)
  );

  // Đăng ký logger với Fastify
  fastify.decorate("logger", logger);
  fastify.decorate("routeLogger", routeLogger);
  fastify.decorateRequest("logger");

  // Sử dụng onRoute hook để log route registration
  // QUAN TRỌNG: Hook này phải được đăng ký trước khi routes được định nghĩa
  fastify.addHook("onRoute", (routeOptions: RouteOptions) => {
    routeLogger.info(
      {
        method: routeOptions.method,
        url: routeOptions.url,
        schema: routeOptions.schema ? "defined" : "none",
        handler: routeOptions.handler?.name || "anonymous",
        logLevel: routeOptions.logLevel,
        config: routeOptions.config,
      },
      `Route registered: ${routeOptions.method} ${routeOptions.url}`
    );
  });

  // Hook để log tất cả requests
  fastify.addHook("onRequest", async (request, _) => {
    request.log = logger;
    request.startTime = process.hrtime();

    logger.info(
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
    logger.info(
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
    logger.error(
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
    logger.info(
      {
        routes: fastify.printRoutes(),
        plugins: fastify.printPlugins(),
      },
      "Server ready - all routes and plugins loaded"
    );
  });

  // Hook để log khi server đóng
  fastify.addHook("onClose", async () => {
    logger.info("Server closing - cleaning up resources");

    // Đóng các streams
    try {
      generalLogStream.end();
      errorLogStream.end();
      accessLogStream.end();
      routeLogStream.end();
    } catch (err) {
      logger.error({ error: err }, "Error closing log streams");
    }
  });
}

export default fp(logger, {
  name: "logger-plugin",
});
