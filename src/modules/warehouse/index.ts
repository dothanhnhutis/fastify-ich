import type { FastifyInstance } from "fastify";
import v1 from "./v1/warehouse.routes";

export default async function warehouseVersionRoutes(fastify: FastifyInstance) {
  fastify.register(v1, { prefix: "/v1/warehouses" });
}
