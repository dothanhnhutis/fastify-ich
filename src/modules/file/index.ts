import type { FastifyInstance } from "fastify";
import v1 from "./v1/file.routes";

export default async function fileVersionRoutes(fastify: FastifyInstance) {
  fastify.register(v1, { prefix: "/v1/files" });
}
