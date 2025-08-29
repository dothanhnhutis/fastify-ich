import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import { FastifyInstance } from "fastify";
import {
  createRoleController,
  deleteRoleByIdController,
  getRoleByIdController,
  queryRoleController,
  updateRoleByIdController,
} from "./role.controller";
import checkPermissionMiddleware from "@/shared/middleware/checkPermission";

import {
  createNewRoleSchema,
  deleteRoleByIdSchema,
  getRoleByIdSchema,
  queryRoleSchema,
  updateRoleByIdSchema,
} from "./role.schema";

export default async function roleRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: queryRoleSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:role:*"]),
      ],
    },
    queryRoleController
  );

  fastify.get(
    "/:id",
    {
      schema: getRoleByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["read:role:id"]),
      ],
    },
    getRoleByIdController
  );

  fastify.post(
    "/",
    {
      schema: createNewRoleSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["create:role"]),
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
        // checkPermissionMiddleware(["update:role"]),
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
        // checkPermissionMiddleware(["delete:role"]),
      ],
    },
    deleteRoleByIdController
  );
}
