import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import { FastifyInstance } from "fastify";
import {
  createPackagingController,
  deletePackagingByIdController,
  getPackagingByIdController,
  getPackagingDetailByIdController,
  getWarehousesByPackagingIdController,
  queryPackagingsController,
  updatePackagingByIdController,
} from "./packaging.controller";
import {
  createPackagingSchema,
  deletePackagingByIdSchema,
  getPackagingByIdSchema,
  queryPackagingsSchema,
  updatePackagingByIdSchema,
} from "./packaging.schema";

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: queryPackagingsSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:packaging:*"]),
      ],
    },
    queryPackagingsController
  );

  fastify.get(
    "/:id/warehouses",
    {
      schema: getPackagingByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:packaging:*"]),
      ],
    },
    getWarehousesByPackagingIdController
  );

  fastify.get(
    "/:id/detail",
    {
      schema: getPackagingByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:packaging:*"]),
      ],
    },
    getPackagingDetailByIdController
  );

  fastify.get(
    "/:id",
    {
      schema: getPackagingByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:packaging:id"]),
      ],
    },
    getPackagingByIdController
  );

  fastify.post(
    "/",
    {
      schema: createPackagingSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["create:packaging"]),
      ],
    },
    createPackagingController
  );

  fastify.patch(
    "/:id",
    {
      schema: updatePackagingByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["update:packaging"]),
      ],
    },
    updatePackagingByIdController
  );

  fastify.delete(
    "/:id",
    {
      schema: deletePackagingByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["delete:packaging"]),
      ],
    },
    deletePackagingByIdController
  );
}
