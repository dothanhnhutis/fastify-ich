import PackagingRepository from "@modules/packaging/v1/packaging.repo";
import RoleRepository from "@modules/role/v1/role.repo";
import { UserRepository } from "@modules/user/v1/user.repo";
import { WarehouseRepository } from "@modules/warehouse/v1/warehouse.repo";
import PostgeSQL, { type QueryOptions } from "@shared/db/db";
import { CustomError } from "@shared/utils/error-handler";
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

declare module "fastify" {
  interface FastifyInstance {
    pg: PostgeSQL;
    query: <R extends QueryResultRow, I = unknown[]>(
      queryConfig: QueryConfig<I>,
      options?: QueryOptions
    ) => Promise<QueryResult<R>>;
    transaction: <T>(
      callback: (client: PoolClient) => Promise<T>,
      options?: QueryOptions
    ) => Promise<T>;
  }
  interface FastifyRequest {
    users: UserRepository;
    roles: RoleRepository;
    warehouses: WarehouseRepository;
    packagings: PackagingRepository;
    // packagingTransactions: PackagingTransactionRepo;
  }
}

async function postgresDB(fastify: FastifyInstance, options: PoolConfig) {
  const dbManager = new PostgeSQL(options);

  fastify.decorate("pg", dbManager);
  fastify.decorateRequest("users");
  fastify.decorateRequest("roles");
  fastify.decorate(
    "query",
    async <R extends QueryResultRow, I = unknown[]>(
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
    req.users = new UserRepository(fastify);
    req.roles = new RoleRepository(fastify);
    req.warehouses = new WarehouseRepository(fastify);
    req.packagings = new PackagingRepository(fastify);
    // req.packagingTransactions = new PackagingTransactionRepo(fastify);
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
