import type { FastifyInstance } from "fastify";
import v1 from "./v1/auth.routes";
export default async function authVersionRoutes(fastify: FastifyInstance) {
  fastify.register(v1, { prefix: "/v1/auth" });
}
