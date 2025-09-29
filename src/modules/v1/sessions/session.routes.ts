import { FastifyInstance } from "fastify";
import { SessionController } from "./session.controller";
import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import { deleteSessionByIdSchema } from "./session.schema";

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
      schema: deleteSessionByIdSchema,
      preHandler: [requiredAuthMiddleware],
    },
    SessionController.deleteById
  );
}
