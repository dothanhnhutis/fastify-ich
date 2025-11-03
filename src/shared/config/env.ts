import dotenv from "dotenv";

dotenv.config();

export default {
  NODE_ENV: process.env.NODE_ENV || "development",
  HOST: process.env.HOST || "localhost",
  PORT: parseInt(process.env.PORT || "4000", 10),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  SERVER_URL: process.env.SERVER_URL || "http://localhost:4000",
  DEBUG: process.env.DEBUG === "true",
  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || "",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),
  // RabbitMQ
  RABBITMQ_USERNAME: process.env.RABBITMQ_USERNAME || "root",
  RABBITMQ_PASSWORD: process.env.RABBITMQ_PASSWORD || "secret",
  RABBITMQ_HOSTNAME: process.env.RABBITMQ_HOSTNAME || "localhost",
  RABBITMQ_PORT: parseInt(process.env.RABBITMQ_PORT || "5672", 10),
  RABBITMQ_VHOST: process.env.RABBITMQ_VHOST || "queue",
  RABBITMQ_FRAME_MAX: parseInt(process.env.RABBITMQ_FRAME_MAX || "131072", 10),
  // Session
  SESSION_KEY_NAME: process.env.SESSION_KEY_NAME || "sid",
  SESSION_MAX_AGE: parseInt(process.env.SESSION_MAX_AGE || "2592000000", 10),
  SESSION_SECRET_KEY:
    process.env.SESSION_SECRET_KEY ||
    "sD3b+3dM7mW/0i6X4KpGb4XtYcwXAXuRCuRgfKoyh2U=",
  // Logger
  LEVEL: process.env.LEVEL || "debug",
};
