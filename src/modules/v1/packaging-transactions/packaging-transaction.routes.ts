import { FastifyInstance } from "fastify";
import { createPackagingTransactionController } from "./packaging-transaction.controller";
import { createNewPackagingTransactionSchema } from "./packaging-transaction.schema";
import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";

export default async function packagingTransactionRoutes(
  fastify: FastifyInstance
) {
  fastify.post(
    "/",
    {
      schema: createNewPackagingTransactionSchema,
      preHandler: [requiredAuthMiddleware],
    },
    createPackagingTransactionController
  );
}
