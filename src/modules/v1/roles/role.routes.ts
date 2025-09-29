import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import { FastifyInstance } from "fastify";
import { RoleController } from "./role.controller";
import checkPermissionMiddleware from "@/shared/middleware/checkPermission";

import { roleSchema } from "./role.schema";

export default async function roleRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: roleSchema["query"],
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:role:*"]),
      ],
    },
    RoleController.query
  );

  fastify.get(
    "/:id",
    {
      schema: roleSchema["getById"],
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:role:id"]),
      ],
    },
    RoleController.getById
  );

  fastify.get(
    "/:id/users",
    {
      schema: roleSchema["getUsersById"],
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:role:*"]),
      ],
    },
    RoleController.getUsersById
  );

  fastify.get(
    "/:id/detail",
    {
      schema: roleSchema["getDetailById"],
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:role:*"]),
      ],
    },
    RoleController.getDetailById
  );

  fastify.post(
    "/",
    {
      schema: roleSchema["create"],
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["create:role"]),
      ],
    },
    RoleController.create
  );

  fastify.patch(
    "/:id",
    {
      schema: roleSchema["updateById"],
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["update:role"]),
      ],
    },
    RoleController.updateById
  );

  fastify.delete(
    "/:id",
    {
      schema: roleSchema["deleteById"],
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["delete:role"]),
      ],
    },
    RoleController.deleteById
  );
}
