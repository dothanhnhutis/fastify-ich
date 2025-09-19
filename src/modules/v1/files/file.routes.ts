import { FastifyInstance } from "fastify";
import { viewFileController } from "./file.controller";
import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";

export default function imageRoutes(fastify: FastifyInstance) {
  fastify.get(
    "*",
    // { preHandler: [requiredAuthMiddleware] },
    viewFileController
  );
}
