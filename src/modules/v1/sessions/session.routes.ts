import { FastifyInstance } from "fastify";
import {
  deleteSessionsByIdController,
  getSessionsController,
} from "./session.controller";
import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import { deleteSessionByIdSchema } from "./session.schema";

export default async function sessionRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      preHandler: [requiredAuthMiddleware],
    },
    getSessionsController
  );

  fastify.delete(
    "/:id",
    {
      schema: deleteSessionByIdSchema,
      preHandler: [requiredAuthMiddleware],
    },
    deleteSessionsByIdController
  );
}
