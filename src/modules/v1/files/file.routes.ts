import { FastifyInstance } from "fastify";
import requiredAuthMiddleware from "@/shared/middleware/requiredAuth";
import { FileController } from "./file.controller";

export default function imageRoutes(fastify: FastifyInstance) {
  fastify.get(
    "*",
    // { preHandler: [requiredAuthMiddleware] },
    FileController.view
  );

  // fastify.post(
  //   "/uploads",
  //   { preHandler: [requiredAuthMiddleware] },
  //   FileController.mutipleUpload
  // );

  // fastify.post(
  //   "/upload",
  //   { preHandler: [requiredAuthMiddleware] },
  //   FileController.singleUpload
  // );
}
