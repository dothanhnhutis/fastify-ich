import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { StatusCodes } from "http-status-codes";
import type {
  PoolClient,
  PoolConfig,
  QueryConfig,
  QueryResult,
  QueryResultRow,
} from "pg";
import PackagingRepo from "@/db/packaging.repo";
import PackagingTransactionRepo from "@/db/packaging-transaction.repo";
import RoleRepo from "@/db/role.repo";
import UserRepo from "@/db/user.repo";
import WarehouseRepo from "@/db/warehouse.repo";
import PostgeSQL, { type QueryOptions } from "../db";
import { CustomError } from "../error-handler";

declare module "fastify" {
  interface FastifyInstance {
    pg: PostgeSQL;
    query: <R extends QueryResultRow = any, I = any[]>(
      queryConfig: QueryConfig<I>,
      options?: QueryOptions
    ) => Promise<QueryResult<R>>;
    transaction: <T>(
      callback: (client: PoolClient) => Promise<T>,
      options?: QueryOptions
    ) => Promise<T>;
  }
  interface FastifyRequest {
    users: UserRepo;
    roles: RoleRepo;
    warehouses: WarehouseRepo;
    packagings: PackagingRepo;
    packagingTransactions: PackagingTransactionRepo;
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
    async <T>(
      callback: (client: PoolClient) => Promise<T>,
      options?: QueryOptions
    ) => {
      return await dbManager.transaction<T>(callback, options);
    }
  );

  fastify.addHook("onReady", async () => {
    const ok = await dbManager.healthCheck();
    if (ok.status === "healthy") {
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
    req.warehouses = new WarehouseRepo(fastify);
    req.packagings = new PackagingRepo(fastify);
    req.packagingTransactions = new PackagingTransactionRepo(fastify);
  });

  fastify.addHook("onClose", async () => {
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
