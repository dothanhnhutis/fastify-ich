import requiredAuthMiddleware from "@shared/middleware/requiredAuth";
import type { FastifyInstance } from "fastify";
import { SessionController } from "./session.controller";
import { sessionSchema } from "./session.schema";

export default async function sessionRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      preHandler: [requiredAuthMiddleware],
    },
    SessionController.getAll
  );

  fastify.delete(
    "/:id",
    {
      schema: sessionSchema.deleteById,
      preHandler: [requiredAuthMiddleware],
    },
    SessionController.deleteById
  );
}
