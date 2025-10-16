import type { FastifyInstance } from "fastify";
import v1 from "./v1/packaging.routes";

export default async function packagingVersionRoutes(fastify: FastifyInstance) {
  fastify.register(v1, { prefix: "/v1/packagings" });
}
