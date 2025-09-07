import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import { FastifyInstance } from "fastify";
import {
  createWarehouseController,
  deleteWarehouseByIdController,
  getWarehousePackagingsByIdController,
  getWarehouseByIdController,
  queryWarehousesController,
  updateWarehouseByIdController,
  getWarehouseDetailByIdController,
} from "./warehouse.controller";
import {
  createWarehouseSchema,
  deleteWarehouseByIdSchema,
  getWarehouseByIdSchema,
  getWarehousePackagingsByIdSchema,
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
    queryWarehousesController
  );

  fastify.get(
    "/:id/detail",
    {
      schema: getWarehouseByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:warehouse:id"]),
      ],
    },
    getWarehouseDetailByIdController
  );

  fastify.get(
    "/:id/packagings",
    {
      schema: getWarehousePackagingsByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:warehouse:id"]),
      ],
    },
    getWarehousePackagingsByIdController
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
    getWarehouseByIdController
  );

  fastify.post(
    "/",
    {
      schema: createWarehouseSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:warehouse"]),
      ],
    },
    createWarehouseController
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
    updateWarehouseByIdController
  );

  fastify.delete(
    "/:id",
    {
      schema: deleteWarehouseByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["delete:warehouse"]),
      ],
    },
    deleteWarehouseByIdController
  );
}
