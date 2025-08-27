import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyCompress from "@fastify/compress";
import addFormats from "ajv-formats";
import addErrors from "ajv-errors";

import config from "./config";
import appRoutes from "../modules";
import logger from "./plugins/logger";
import redisPlugin from "./plugins/redis";
import rabbitMQPlugin from "./plugins/amqp";
import { errorHandler } from "./error-handler";
import postgreSQLPlugin from "./plugins/postgres";

export async function buildServer() {
  const server = fastify({
    logger: false,
    trustProxy: true,
    ajv: {
      customOptions: {
        allErrors: true,
        $data: true,
      },
      plugins: [
        addFormats, // Thêm format validation (email, date, etc.)
        addErrors, // Thêm custom error messages
      ],
    },
  });

  // Plugins
  server.register(fastifyHelmet);
  server.register(fastifyCors, {
    origin: config.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });
  server.register(fastifyCompress, {
    requestEncodings: ["gzip", "deflate"], // Bỏ brotli
    threshold: 1024,
    customTypes: /^text\/|\+json$|\+text$|\+xml$/,
    global: true,
  });

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
      exchanges: [
        {
          name: "exchange-fanout",
          type: "fanout",
          options: {
            durable: true,
          },
        },
        {
          name: "exchange-headers",
          type: "headers",
          options: {
            durable: true,
          },
        },
        {
          name: "exchange-direct",
          type: "direct",
          options: {
            durable: true,
          },
        },
        {
          name: "exchange-topic",
          type: "topic",
          options: {
            durable: true,
          },
        },
      ],
      queues: [
        {
          type: "queue",
          name: "test-queue",
          options: { durable: true },
        },
        {
          type: "fanout",
          name: "queue-exchange-fanout",
          exchange: "exchange-fanout",
          options: { durable: true },
        },
        {
          type: "headers",
          name: "queue-exchange-headers-any",
          exchange: "exchange-headers",
          options: { durable: true },
          headers: {
            "x-match": "any",
            error: "1",
            warning: "2",
          },
        },
        {
          type: "headers",
          name: "queue-exchange-headers-all",
          exchange: "exchange-headers",
          options: { durable: true },
          headers: {
            "x-match": "all",
            text: "123",
            ok: "456",
          },
        },
        {
          type: "direct",
          name: "queue-exchange-direct-error",
          exchange: "exchange-direct",
          routingKey: "error",
          options: { durable: true },
        },
        {
          type: "direct",
          name: "queue-exchange-direct-warning",
          exchange: "exchange-direct",
          routingKey: "warning",
          options: { durable: true },
        },
        {
          type: "direct",
          name: "queue-exchange-direct-info",
          exchange: "exchange-direct",
          routingKey: "info",
          options: { durable: true },
        },
        {
          type: "topic",
          name: "queue-exchange-topic-1",
          exchange: "exchange-topic",
          routingKey: "*.orange.*",
          options: { durable: true },
        },
        {
          type: "topic",
          name: "queue-exchange-topic-2",
          exchange: "exchange-topic",
          routingKey: "*.*.rabbit",
          options: { durable: true },
        },
        {
          type: "topic",
          name: "queue-exchange-topic-2",
          exchange: "exchange-topic",
          routingKey: "lazy.#",
          options: { durable: true },
        },
        {
          type: "topic",
          name: "queue-exchange-topic-3",
          exchange: "exchange-topic",
          routingKey: "lazy.#",
          options: { durable: true },
        },
      ],
    });

  // Routes
  server.register(appRoutes, { prefix: "/api" });

  // Error handling
  server.setErrorHandler(errorHandler);

  return server;
}
