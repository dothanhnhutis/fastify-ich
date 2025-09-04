import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import authRoutes from "./auth/auth.routes";
import userRoutes from "./users/user.routes";
import roleRoutes from "./roles/role.routes";
import sessionRoutes from "./session/session.routes";
import warehouseRoutes from "./warehouse/warehouse.routes";

export default async function versionRoutes(fastify: FastifyInstance) {
  fastify.get("/health", (_: FastifyRequest, reply: FastifyReply) => {
    reply.code(200).send({
      status: "ok",
      environment: "development",
    });
  });

  fastify.register(authRoutes, { prefix: "/auth" });
  fastify.register(userRoutes, { prefix: "/users" });
  fastify.register(sessionRoutes, { prefix: "/users/sessions" });
  fastify.register(roleRoutes, { prefix: "/roles" });
  fastify.register(warehouseRoutes, { prefix: "/warehouses" });
}
