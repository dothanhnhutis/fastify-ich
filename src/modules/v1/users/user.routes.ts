import { FastifyInstance } from "fastify";
import {
  createUserController,
  currentUserController,
  logoutUserController,
  queryUserController,
  updateUserByIdController,
} from "./user.controller";
import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import checkPermissionMiddleware from "@/shared/middleware/checkPermission";
import {
  createNewUserSchema,
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
