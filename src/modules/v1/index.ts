import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import authRoutes from "./auth/auth.routes";
import userRoutes from "./users/user.routes";
import roleRoutes from "./roles/role.routes";
import fileRoutes from "./files/file.routes";
import sessionRoutes from "./sessions/session.routes";
import warehouseRoutes from "./warehouses/warehouse.routes";
import packagingRoutes from "./packagings/packaging.routes";

import packagingTransactionRoutes from "./packaging-transactions/packaging-transaction.routes";

export default async function versionRoutes(fastify: FastifyInstance) {
  fastify.get("/health", (_: FastifyRequest, reply: FastifyReply) => {
    reply.code(200).send({
      status: "ok",
      environment: "development",
    });
  });

  fastify.register(authRoutes, { prefix: "/auth" });
  fastify.register(roleRoutes, { prefix: "/roles" });
  fastify.register(userRoutes, { prefix: "/users" });
  fastify.register(fileRoutes, { prefix: "/files" });
  fastify.register(sessionRoutes, { prefix: "/users/sessions" });
  fastify.register(warehouseRoutes, { prefix: "/warehouses" });
  fastify.register(packagingRoutes, { prefix: "/packagings" });
  fastify.register(packagingTransactionRoutes, {
    prefix: "/packaging-transactions",
  });
}
