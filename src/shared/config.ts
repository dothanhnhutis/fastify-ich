import dotenv from "dotenv";

dotenv.config();

export default {
  NODE_ENV: process.env.NODE_ENV || "development",
  HOST: process.env.HOST || "localhost",
  PORT: parseInt(process.env.PORT || "4000"),
  CLIENT_URL: process.env.CLIENT_URL,
  DEBUG: process.env.DEBUG == "true",
  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || "",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379"),
  // RabbitMQ
  RABBITMQ_USERNAME: process.env.RABBITMQ_USERNAME || "root",
  RABBITMQ_PASSWORD: process.env.RABBITMQ_PASSWORD || "secret",
  RABBITMQ_HOSTNAME: process.env.RABBITMQ_HOSTNAME || "localhost",
  RABBITMQ_PORT: parseInt(process.env.RABBITMQ_PORT || "5672"),
  RABBITMQ_VHOST: process.env.RABBITMQ_VHOST || "queue",
  RABBITMQ_FRAME_MAX: parseInt(process.env.RABBITMQ_FRAME_MAX || "131072"),
};
