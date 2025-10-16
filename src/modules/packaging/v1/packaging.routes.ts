import { multerMiddleware } from "@shared/middleware/multer";
import requiredAuthMiddleware from "@shared/middleware/requiredAuth";
import type { FastifyInstance } from "fastify";
import { PackagingController } from "./packaging.controller";
import { packagingSchema } from "./packaging.schema";

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/:id/warehouses",
    {
      schema: packagingSchema.getWarehousesById,
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
      schema: packagingSchema.getDetailById,
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
      schema: packagingSchema.getById,
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
      schema: packagingSchema.query,
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
      schema: packagingSchema.create,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["create:packaging"]),
      ],
    },
    PackagingController.create
  );

  fastify.patch(
    "/:id/image",
    {
      schema: packagingSchema.updateImageById,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["update:packaging"]),
        multerMiddleware([
          {
            name: "image",
            fileSize: 2 * 1024 * 1024,
            type: "file",
            uploadDir: "/uploads/images",
            allowedMimeTypes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
            ],
            maxCount: 1,
          },
        ]),
      ],
    },
    PackagingController.uploadPackagingImage
  );

  fastify.patch(
    "/:id",
    {
      schema: packagingSchema.updateById,
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
