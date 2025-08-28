import fp from "fastify-plugin";
import Redis, { RedisOptions as RedisOpts } from "ioredis";
import { FastifyInstance } from "fastify";
import SessionRepo from "../db/repositories/session.repo";
import { CustomError } from "../error-handler";
import { StatusCodes } from "http-status-codes";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
  interface FastifyRequest {
    sessions: SessionRepo;
  }
}

interface RedisOptions
  extends Omit<RedisOpts, "retryStrategy" | "lazyConnect"> {}

async function redisCache(fastify: FastifyInstance, options: RedisOptions) {
  let isConnected = false,
    reconnectAttempts = 0;
  const reconnectInterval = 5000;

  let redisClient: Redis = new Redis({
    lazyConnect: true,
    retryStrategy: () => null,
    ...options,
  });

  // Decorate với getter để luôn trả về client hiện tại
  // fastify.decorate("redis", {
  //   get client() {
  //     return redisClient;
  //   },
  // });

  // Hoặc sử dụng cách này (đơn giản hơn):
  fastify.decorate("redis", redisClient);
  fastify.decorateRequest("session");

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Hàm để cập nhật client reference
  function updateRedisClient(newClient: Redis) {
    redisClient = newClient;
    // Cập nhật lại decorator
    fastify.redis = newClient;
  }

  async function reconnect(): Promise<void> {
    while (!isConnected) {
      console.log(`Redis - Attempting to reconnect to cache...`);
      try {
        // Disconnect client cũ nếu chưa disconnect
        if (redisClient && redisClient.status !== "end") {
          redisClient.disconnect();
        }

        const newRedisClient = new Redis({
          lazyConnect: true,
          retryStrategy: () => null,
          ...options,
        });

        await newRedisClient.connect();
        console.log("Redis - Connected successfully");

        // Cập nhật client reference
        updateRedisClient(newRedisClient);

        newRedisClient.on("error", (err) => {
          console.log("Redis connection error:", err.message);
        });

        newRedisClient.on("close", async () => {
          console.log("Redis connection closed");
          isConnected = false;
          await reconnect();
        });

        isConnected = true;
        reconnectAttempts = 0;
        break;
      } catch (error) {
        reconnectAttempts++;
        console.log(
          `Redis - Reconnection attempt ${reconnectAttempts} failed:`,
          error
        );
        await sleep(reconnectInterval);
      }
    }
  }

  fastify.addHook("onReady", async () => {
    try {
      await redisClient.connect();
      console.log("Redis - connected successfully");
      isConnected = true;

      redisClient.on("error", (err) => {
        console.log("Redis connection error:", err.message);
      });

      redisClient.on("close", async () => {
        console.log("Redis connection closed");
        isConnected = false;
        await reconnect();
      });
    } catch (error) {
      console.log("Redis initial connection failed:", error);
      // throw new CustomError({
      //   message:
      //     "Cache temporarily unavailable. Please try again in a few moments",
      //   statusCode: StatusCodes.SERVICE_UNAVAILABLE,
      //   statusText: "SERVICE_UNAVAILABLE",
      // });
    }
  });

  fastify.addHook("onRequest", async (req) => {
    // Create session with error handling
    try {
      req.sessions = new SessionRepo(fastify);
    } catch (error: unknown) {
      // fastify.logger.error("Session initialization failed", { error });
      throw new CustomError({
        message: "Session initialization failed",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        statusText: "INTERNAL_SERVER_ERROR",
      });
    }
  });

  fastify.addHook("onClose", async () => {
    console.log("Closing Redis connection");
    isConnected = false;
    if (redisClient && redisClient.status !== "end") {
      await redisClient.quit();
    }
  });
}

export default fp(redisCache, {
  name: "redis-plugin",
});
