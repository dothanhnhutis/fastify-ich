import {
  PoolClient,
  PoolConfig,
  QueryConfig,
  QueryResult,
  QueryResultRow,
} from "pg";
import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";

import PostgeSQL, { QueryOptions } from "../db";
import { CustomError } from "../error-handler";
import { StatusCodes } from "http-status-codes";
import UserRepo from "../db/repositories/user.repo";
import RoleRepo from "../db/repositories/role.repo";

declare module "fastify" {
  interface FastifyInstance {
    pg: PostgeSQL;
    query: <R extends QueryResultRow = any, I = any[]>(
      queryConfig: QueryConfig<I>,
      options?: QueryOptions
    ) => Promise<QueryResult<R>>;
    transaction: (
      callback: (client: PoolClient) => Promise<void>,
      options?: QueryOptions
    ) => Promise<void>;
  }
  interface FastifyRequest {
    users: UserRepo;
    roles: RoleRepo;
  }
}

async function postgresDB(fastify: FastifyInstance, options: PoolConfig) {
  const dbManager = new PostgeSQL(options);

  fastify.decorate("pg", dbManager);
  fastify.decorateRequest("users");
  fastify.decorateRequest("roles");
  fastify.decorate(
    "query",
    async <R extends QueryResultRow = any, I = any[]>(
      queryConfig: QueryConfig<I>,
      options?: QueryOptions
    ) => {
      return await dbManager.query<R, I>(queryConfig, options);
    }
  );

  // Add transaction method
  fastify.decorate(
    "transaction",
    async (
      callback: (client: PoolClient) => Promise<void>,
      options?: QueryOptions
    ) => {
      return await dbManager.transaction(callback, options);
    }
  );

  fastify.addHook("onReady", async () => {
    const ok = await dbManager.healthCheck();
    if (ok.status == "healthy") {
      fastify.logger.info("PostgreSQL - Database connected successfully");
    } else {
      throw new CustomError({
        message:
          "PostgreSQL - Database temporarily unavailable. Please try again in a few moments",
        statusCode: StatusCodes.SERVICE_UNAVAILABLE,
        statusText: "SERVICE_UNAVAILABLE",
      });
    }
  });

  fastify.addHook("onRequest", async (req, _reply) => {
    req.users = new UserRepo(fastify);
    req.roles = new RoleRepo(fastify);
  });

  fastify.addHook("onClose", async (instance) => {
    await dbManager.close();
  });

  // fastify.get("/healthy/db", async (req, reply) => {
  //   const health = await dbManager.healthCheck();
  //   const statusCode = health.status === "healthy" ? 200 : 503;
  //   reply.code(statusCode).send(health);
  // });

  // fastify.get("/test-db", async (req, reply) => {
  //   const a = await fastify.query({
  //     text: "select * from users",
  //   });
  //   console.log(a);
  //   reply.code(200).send("ok");
  // });
}

export default fp(postgresDB, {
  name: "postgreSQL-Plugin",
});
