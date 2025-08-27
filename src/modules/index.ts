import { FastifyInstance } from "fastify";
import versionRoutes from "./v1";

export default async function appRoutes(fastify: FastifyInstance) {
  fastify.register(versionRoutes, { prefix: "/v1" });
}
