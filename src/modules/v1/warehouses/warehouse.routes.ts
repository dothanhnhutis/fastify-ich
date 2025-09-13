import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import { FastifyInstance } from "fastify";
import {
  createNewWarehouseController,
  deleteWarehouseByIdController,
  getWarehousesByPackagingIdController,
  getWarehouseByIdController,
  queryWarehousesController,
  updateWarehouseByIdController,
  getWarehouseDetailByIdController,
} from "./warehouse.controller";
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
    queryWarehousesController
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
    getWarehouseDetailByIdController
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
    getWarehousesByPackagingIdController
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
      schema: createNewWarehouseSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:warehouse"]),
      ],
    },
    createNewWarehouseController
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
