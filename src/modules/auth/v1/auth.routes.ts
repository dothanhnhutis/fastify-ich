import type { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";
import { authSchema } from "./auth.schema";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/signin",
    {
      schema: authSchema.signin,
    },
    AuthController.signIn
  );
}
