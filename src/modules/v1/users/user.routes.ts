import { FastifyInstance } from "fastify";
import {
  createNewUserController,
  currentUserController,
  getUserByIdController,
  getUserDetailByIdController,
  getRolesByUserIdController,
  logoutUserController,
  queryUsersController,
  updateUserByIdController,
} from "./user.controller";
import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import checkPermissionMiddleware from "@/shared/middleware/checkPermission";
import {
  createNewUserSchema,
  getUserByIdSchema,
  getUserDetailByIdSchema,
  getRolesByUserIdSchema,
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
    queryUsersController
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
    getUserByIdController
  );

  fastify.get(
    "/:id/roles",
    {
      schema: getRolesByUserIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["read:user:*"]),
      ],
    },
    getRolesByUserIdController
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

  fastify.post(
    "/",
    {
      schema: createNewUserSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["create:user"]),
      ],
    },
    createNewUserController
  );

  fastify.patch(
    "/:id",
    {
      schema: updateUserByIdSchema,
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["update:user"]),
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
