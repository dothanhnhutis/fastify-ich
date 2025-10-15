import type { FastifyInstance } from "fastify";
import v1 from "./v1/user.routes";

export default async function userVersionRoutes(fastify: FastifyInstance) {
  fastify.register(v1, { prefix: "/v1" });
}
