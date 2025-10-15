import type { FastifyInstance } from "fastify";
import v1 from "./v1/role.routes";

export default async function roleVersionRoutes(fastify: FastifyInstance) {
  fastify.register(v1, { prefix: "/v1" });
}
