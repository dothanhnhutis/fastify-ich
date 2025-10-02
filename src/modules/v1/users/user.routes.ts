import { FastifyInstance } from "fastify";
import { SuperUserController, UserController } from "./user.controller";
import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import checkPermissionMiddleware from "@/shared/middleware/checkPermission";
import { userSchema } from "./user.schema";
import { signleFileUpload } from "@/shared/middleware/validateFileUpload";

export default async function userRoutes(fastify: FastifyInstance) {
  // Admin
  fastify.get(
    "/",
    {
      schema: userSchema["query"],
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:user:*"]),
      ],
    },
    SuperUserController.query
  );

  fastify.get(
    "/:id",
    {
      schema: userSchema["getById"],
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:user:id"]),
      ],
    },
    SuperUserController.getById
  );

  fastify.get(
    "/:id/roles",
    {
      schema: userSchema["getRolesById"],
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:user:*"]),
      ],
    },
    SuperUserController.getRolesById
  );

  fastify.get(
    "/:id/detail",
    {
      schema: userSchema["getDetailById"],
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:user:*"]),
      ],
    },
    SuperUserController.getDetailById
  );

  fastify.post(
    "/",
    {
      schema: userSchema["create"],
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["create:user"]),
      ],
    },
    SuperUserController.create
  );

  fastify.patch(
    "/:id",
    {
      schema: userSchema["updateById"],
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["update:user"]),
      ],
    },
    SuperUserController.updateById
  );

  // Base
  fastify.get(
    "/me",
    { preHandler: [requiredAuthMiddleware] },
    UserController.me
  );

  fastify.patch(
    "/avatar",
    {
      preHandler: [
        signleFileUpload({
          fieldName: "avatar",
          maxFileSize: 2 * 1024 * 1024,
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
          ],
        }),
      ],
    },
    UserController.uploadAvatar
  );

  fastify.delete("/logout", UserController.logout);
}
