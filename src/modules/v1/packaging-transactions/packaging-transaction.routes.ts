import { FastifyInstance } from "fastify";
import { PackagingTransactionController } from "./packaging-transaction.controller";
import { packagingTransactionSchema } from "./packaging-transaction.schema";
import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";

export default async function packagingTransactionRoutes(
  fastify: FastifyInstance
) {
  fastify.get(
    "/:id/detail",
    { preHandler: [requiredAuthMiddleware] },
    PackagingTransactionController.getDetailById
  );

  fastify.get(
    "/:id/items",
    { preHandler: [requiredAuthMiddleware] },
    PackagingTransactionController.getItemsById
  );

  fastify.get(
    "/:id",
    { preHandler: [requiredAuthMiddleware] },
    PackagingTransactionController.getById
  );

  fastify.post(
    "/",
    {
      schema: packagingTransactionSchema.create,
      preHandler: [requiredAuthMiddleware],
    },
    PackagingTransactionController.create
  );
}
