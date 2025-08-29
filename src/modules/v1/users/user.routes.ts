import { FastifyInstance } from "fastify";
import {
  createUserController,
  currentUserController,
  logoutUserController,
  queryUserController,
} from "./user.controller";
import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import checkPermissionMiddleware from "@/shared/middleware/checkPermission";

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      preHandler: [
        requiredAuthMiddleware,
        checkPermissionMiddleware(["get:user:*"]),
      ],
    },
    queryUserController
  );

  fastify.post(
    "/",
    {
      preHandler: [
        requiredAuthMiddleware,
        // checkPermissionMiddleware(["create:user"]),
      ],
    },
    createUserController
  );

  fastify.get(
    "/me",
    { preHandler: [requiredAuthMiddleware] },
    currentUserController
  );

  fastify.delete("/logout", logoutUserController);
}
