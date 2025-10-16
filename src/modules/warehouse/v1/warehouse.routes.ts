import requiredAuthMiddleware from "@shared/middleware/requiredAuth";
import type { FastifyInstance } from "fastify";
import { WarehouseController } from "./warehouse.controller";
import { warehouseSchema } from "./warehouse.schema";

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: warehouseSchema.query,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:warehouse:*"]),
      ],
    },
    WarehouseController.query
  );

  fastify.get(
    "/:id/detail",
    {
      schema: warehouseSchema.getDetailById,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:warehouse:*"]),
      ],
    },
    WarehouseController.getDetailById
  );

  fastify.get(
    "/:id/packagings",
    {
      schema: warehouseSchema.getPackagingsById,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:warehouse:*"]),
      ],
    },
    WarehouseController.getPackagingsById
  );

  fastify.get(
    "/:id",
    {
      schema: warehouseSchema.getById,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:warehouse:id"]),
      ],
    },
    WarehouseController.getById
  );

  fastify.post(
    "/",
    {
      schema: warehouseSchema.create,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:warehouse"]),
      ],
    },
    WarehouseController.create
  );

  fastify.patch(
    "/:id",
    {
      schema: warehouseSchema.updateById,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["update:warehouse"]),
      ],
    },
    WarehouseController.updateById
  );

  // fastify.delete(
  //   "/:id",
  //   {
  //     schema: deleteWarehouseByIdSchema,
  //     preHandler: [
  //       requiredAuthMiddleware,
  //       // checkPermissionMiddleware(["delete:warehouse"]),
  //     ],
  //   },
  //   deleteWarehouseByIdController
  // );
}
