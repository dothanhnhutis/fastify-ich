// import { Type } from "@sinclair/typebox";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import authRoutes from "./auth";
import fileRoutes from "./file";
import packagingRoutes from "./packaging";
import roleRoutes from "./role";
import sessionRoutes from "./session";
import userRoutes from "./user";
import warehouseRoutes from "./warehouse";

// const sortEnum = [
//   "name.asc",
//   "name.desc",
//   "permissions.asc",
//   "permissions.desc",
//   "description.asc",
//   "description.desc",
//   "status.asc",
//   "status.desc",
//   "created_at.asc",
//   "created_at.desc",
//   "updated_at.asc",
//   "updated_at.desc",
// ];
// export const queryStringRolesSchema = Type.Partial(
//   Type.Object({
//     name: Type.String({
//       errorMessage: {
//         type: "Tên vai trò phải là chuỗi.",
//       },
//     }),
//     sort: Type.Array(
//       Type.String({
//         enum: sortEnum,
//         errorMessage: {
//           type: "sort phải là chuỗi.",
//           enum: `sort phải là một trong: ${sortEnum.join(", ")}`,
//         },
//       })
//     ),
//   })
// );

export default async function versionRoutes(fastify: FastifyInstance) {
  fastify.get("/health", (_: FastifyRequest, reply: FastifyReply) => {
    reply.code(200).send({
      status: "ok",
      environment: "development",
    });
  });

  fastify.register(authRoutes);
  fastify.register(userRoutes);
  fastify.register(roleRoutes);
  fastify.register(fileRoutes);
  fastify.register(sessionRoutes);
  fastify.register(warehouseRoutes);
  fastify.register(packagingRoutes);
  // fastify.register(packagingTransactionRoutes, {
  //   prefix: "/packaging-transactions",
  // });
}
