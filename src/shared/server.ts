import fastify from "fastify";
import addErrors from "ajv-errors";
import addFormats from "ajv-formats";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyCompress from "@fastify/compress";

import config from "./config";
import appRoutes from "../modules";
import logger from "./plugins/logger";
import redisPlugin from "./plugins/redis";
import rabbitMQPlugin from "./plugins/amqp";
import cookiePlugin from "./plugins/cookie";
import sessionPlugin from "./plugins/session";
import { errorHandler } from "./error-handler";
import postgreSQLPlugin from "./plugins/postgres";

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
