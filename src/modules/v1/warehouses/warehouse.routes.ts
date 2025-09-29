import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import { FastifyInstance } from "fastify";
import { WarehouseController } from "./warehouse.controller";
import {
  createNewWarehouseSchema,
  deleteWarehouseByIdSchema,
  getPackagingsByWarehouseIdSchema,
  getWarehouseByIdSchema,
  queryWarehousesSchema,
  updateWarehouseByIdSchema,
} from "./warehouse.schema";

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: queryWarehousesSchema,
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
      schema: getWarehouseByIdSchema,
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
      schema: getPackagingsByWarehouseIdSchema,
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
      schema: getWarehouseByIdSchema,
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
      schema: createNewWarehouseSchema,
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
      schema: updateWarehouseByIdSchema,
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
