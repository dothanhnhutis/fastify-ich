import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import { FastifyInstance } from "fastify";
import { PackagingController } from "./packaging.controller";
import {
  createNewPackagingSchema,
  deletePackagingByIdSchema,
  getPackagingByIdSchema,
  getWarehousesByPackagingIdSchema,
  queryPackagingsSchema,
  updatePackagingByIdSchema,
} from "./packaging.schema";

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/:id/warehouses",
    {
      schema: getWarehousesByPackagingIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:packaging:*"]),
      ],
    },
    PackagingController.getWarehousesById
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
    PackagingController.getDetailById
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
    PackagingController.getById
  );

  fastify.get(
    "/",
    {
      schema: queryPackagingsSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:packaging:*"]),
      ],
    },
    PackagingController.query
  );

  fastify.post(
    "/",
    {
      schema: createNewPackagingSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["create:packaging"]),
      ],
    },
    PackagingController.create
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
    PackagingController.updateById
  );

  // fastify.delete(
  //   "/:id",
  //   {
  //     schema: deletePackagingByIdSchema,
  //     preHandler: [
  //       requiredAuthMiddleware,
  //       // checkPermissionMiddleware(["delete:packaging"]),
  //     ],
  //   },
  //   deletePackagingByIdController
  // );
}
