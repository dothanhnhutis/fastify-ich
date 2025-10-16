import type { FastifyInstance } from "fastify";
import v1 from "./v1/session.routes";

export default async function sessionVersionRoutes(fastify: FastifyInstance) {
  fastify.register(v1, { prefix: "/v1/users/sessions" });
}
