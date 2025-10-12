import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import authRoutes from "./auth/auth.routes";
import userRoutes from "./users/user.routes";
import roleRoutes from "./roles/role.routes";
import fileRoutes from "./files/file.routes";
import sessionRoutes from "./sessions/session.routes";
import warehouseRoutes from "./warehouses/warehouse.routes";
import packagingRoutes from "./packagings/packaging.routes";

import packagingTransactionRoutes from "./packaging-transactions/packaging-transaction.routes";
import { Type } from "@sinclair/typebox";

const sortEnum = [
  "name.asc",
  "name.desc",
  "permissions.asc",
  "permissions.desc",
  "description.asc",
  "description.desc",
  "status.asc",
  "status.desc",
  "created_at.asc",
  "created_at.desc",
  "updated_at.asc",
  "updated_at.desc",
];
export const queryStringRolesSchema = Type.Partial(
  Type.Object({
    name: Type.String({
      errorMessage: {
        type: "Tên vai trò phải là chuỗi.",
      },
    }),
    sort: Type.Array(
      Type.String({
        enum: sortEnum,
        errorMessage: {
          type: "sort phải là chuỗi.",
          enum: `sort phải là một trong: ${sortEnum.join(", ")}`,
        },
      })
    ),
  })
);

export default async function versionRoutes(fastify: FastifyInstance) {
  fastify.get("/health", (_: FastifyRequest, reply: FastifyReply) => {
    reply.code(200).send({
      status: "ok",
      environment: "development",
    });
  });

  fastify.register(authRoutes, { prefix: "/auth" });
  fastify.register(roleRoutes, { prefix: "/roles" });
  fastify.register(userRoutes, { prefix: "/users" });
  fastify.register(fileRoutes, { prefix: "/files" });
  fastify.register(sessionRoutes, { prefix: "/users/sessions" });
  fastify.register(warehouseRoutes, { prefix: "/warehouses" });
  fastify.register(packagingRoutes, { prefix: "/packagings" });
  // fastify.register(packagingTransactionRoutes, {
  //   prefix: "/packaging-transactions",
  // });
}
