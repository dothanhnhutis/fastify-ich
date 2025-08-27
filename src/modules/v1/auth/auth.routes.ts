import { FastifyInstance } from "fastify";

import { signInSchema } from "./auth.schema";
import { signInController } from "./auth.controller";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/signin",
    {
      schema: signInSchema,
    },
    signInController
  );
}
