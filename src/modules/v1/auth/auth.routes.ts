import { FastifyInstance } from "fastify";

import { authSchema } from "./auth.schema";
import { AuthController } from "./auth.controller";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/signin",
    {
      schema: authSchema["signin"],
    },
    AuthController.signIn
  );
}
