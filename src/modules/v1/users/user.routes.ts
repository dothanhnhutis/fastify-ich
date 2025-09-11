import { FastifyInstance } from "fastify";
import {
  createUserController,
  currentUserController,
  getUserRoleByIdController,
  getUserDetailByIdController,
  getRolesByUserIdController,
  logoutUserController,
  queryUserController,
  updateUserByIdController,
} from "./user.controller";
import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import checkPermissionMiddleware from "@/shared/middleware/checkPermission";
import {
  createNewUserSchema,
  getUserByIdSchema,
  getUserDetailByIdSchema,
  getUserRolesByUserIdSchema,
  queryUsersSchema,
  updateUserByIdSchema,
} from "./user.schema";

export default async function userRoutes(fastify: FastifyInstance) {
  // Admin
  fastify.get(
    "/",
    {
      schema: queryUsersSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:user:*"]),
      ],
    },
    queryUserController
  );

  fastify.get(
    "/:id/detail",
    {
      schema: getUserDetailByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:user:*"]),
      ],
    },
    getUserDetailByIdController
  );

  fastify.get(
    "/:id/roles",
    {
      schema: getUserRolesByUserIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:user:*"]),
      ],
    },
    getRolesByUserIdController
  );

  fastify.get(
    "/:id",
    {
      schema: getUserByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:user:id"]),
      ],
    },
    getUserRoleByIdController
  );

  fastify.post(
    "/",
    {
      schema: createNewUserSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["create:user"]),
      ],
    },
    createUserController
  );

  fastify.patch(
    "/:id",
    {
      schema: updateUserByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["create:user"]),
      ],
    },
    updateUserByIdController
  );

  // Base
  fastify.get(
    "/me",
    { preHandler: [requiredAuthMiddleware] },
    currentUserController
  );

  fastify.delete("/logout", logoutUserController);
}
