import { UAParser } from "ua-parser-js";
import { FastifyInstance } from "fastify";
import { StatusCodes } from "http-status-codes";

import config from "@/shared/config";
import Helper from "@/shared/helper";
import { CustomError } from "@/shared/error-handler";

const SCAN_COUNT = 100;

export default class SessionRepo {
  constructor(private fastify: FastifyInstance) {}

  async create(
    data: ReqInfo
  ): Promise<{ sessionId: string; cookie: CookieOptions }> {
    const id = await Helper.generateId();
    const now = new Date();

    const cookieOpt: CookieOptions = {
      path: "/",
      httpOnly: true,
      secure: config.NODE_ENV == "production",
      expires: new Date(now.getTime() + config.SESSION_MAX_AGE),
      ...data.cookie,
    };
    const sessionId = `${config.SESSION_KEY_NAME}:${data.userId}:${id}`;

    const session: Session = {
      id,
      provider: data.provider,
      userId: data.userId,
      cookie: cookieOpt,
      ip: data.ip,
      userAgent: UAParser(data.userAgentRaw),
      lastAccess: now,
      createAt: now,
    };

    try {
      if (cookieOpt.expires) {
        await this.fastify.redis.set(
          sessionId,
          JSON.stringify(session),
          "PX",
          cookieOpt.expires.getTime() - Date.now()
        );
      } else {
        await this.fastify.redis.set(sessionId, JSON.stringify(session));
      }

      return {
        sessionId,
        cookie: cookieOpt,
      };
    } catch (error: unknown) {
      throw new CustomError({
        message: `SessionRepo.create() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async findById(id: string): Promise<Session | null> {
    try {
      const sessionCache = await this.fastify.redis.get(id);
      if (!sessionCache) return null;
      return JSON.parse(sessionCache) as Session;
    } catch (error) {
      throw new CustomError({
        message: `SessionRepo.findById() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async refresh(id: string): Promise<Session | null> {
    try {
      const session = await this.fastify.redis.get(id);
      if (!session) return null;
      const sessionData: Session = JSON.parse(session);
      const now = Date.now();
      const expires: Date = new Date(now + config.SESSION_MAX_AGE);
      sessionData.lastAccess = new Date(now);
      sessionData.cookie.expires = expires;
      await this.fastify.redis.set(
        id,
        JSON.stringify(sessionData),
        "PX",
        expires.getTime() - Date.now()
      );
      return sessionData;
    } catch (error: unknown) {
      throw new CustomError({
        message: `SessionRepo.refresh() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  /**
   * TODO: RedisCustom extend Redis
   * RedisCustom.findKeysByPattern
   * @param pattern
   * @returns
   */
  private async findKeysByPattern(pattern: string): Promise<string[]> {
    let cursor: string = "0";
    const results: string[] = [];
    try {
      do {
        const [nextCursor, keys] = await this.fastify.redis.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          SCAN_COUNT
        );
        cursor = nextCursor;
        results.push(...keys);
      } while (cursor !== "0");
      return results;
    } catch (error: unknown) {
      throw new CustomError({
        message: `SessionRepo.findKeysByPattern() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }
  /**
   * TODO: chuyển sang UserRepo
   * @param userId string
   * @returns Promise<Session[]>
   */
  async findByUserId(userId: string): Promise<Session[]> {
    const sessionIds = await this.findKeysByPattern(
      `${config.SESSION_KEY_NAME}:${userId}:*`
    );

    try {
      const data: Session[] = [];
      for (const id of sessionIds) {
        const session = await this.findById(id);
        if (!session) continue;
        data.push(session);
      }

      return data;
    } catch (error) {
      throw new CustomError({
        message: `SessionRepo.findByUserId() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.fastify.redis.del(id);
    } catch (error) {
      throw new CustomError({
        message: `SessionRepo.delete() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }
}
