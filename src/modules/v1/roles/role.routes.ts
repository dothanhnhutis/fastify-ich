import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import { FastifyInstance } from "fastify";
import {
  createRoleController,
  deleteRoleByIdController,
  getRoleByIdController,
  getRoleDetailByIdController,
  getUsersByRoleIdController,
  queryRolesController,
  updateRoleByIdController,
} from "./role.controller";
import checkPermissionMiddleware from "@/shared/middleware/checkPermission";

import {
  createNewRoleSchema,
  deleteRoleByIdSchema,
  getRoleByIdSchema,
  getRoleDetailByIdSchema,
  getUsersByRoleIdSchema,
  queryStringRolesSchema,
  updateRoleByIdSchema,
} from "./role.schema";

export default async function roleRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: queryStringRolesSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:role:*"]),
      ],
    },
    queryRolesController
  );

  fastify.get(
    "/:id",
    {
      schema: getRoleByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:role:id"]),
      ],
    },
    getRoleByIdController
  );

  fastify.get(
    "/:id/users",
    {
      schema: getUsersByRoleIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:role:*"]),
      ],
    },
    getUsersByRoleIdController
  );

  fastify.get(
    "/:id/detail",
    {
      schema: getRoleDetailByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:role:*"]),
      ],
    },
    getRoleDetailByIdController
  );

  fastify.post(
    "/",
    {
      schema: createNewRoleSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["create:role"]),
      ],
    },
    createRoleController
  );

  fastify.patch(
    "/:id",
    {
      schema: updateRoleByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["update:role"]),
      ],
    },
    updateRoleByIdController
  );

  fastify.delete(
    "/:id",
    {
      schema: deleteRoleByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["delete:role"]),
      ],
    },
    deleteRoleByIdController
  );
}
