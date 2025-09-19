import { Static, Type } from "@sinclair/typebox";
import { FastifySchema } from "fastify";

const deleteSessionByIdParamsSchema = Type.Object({
  id: Type.String(),
});

export const deleteSessionByIdSchema: FastifySchema = {
  params: deleteSessionByIdParamsSchema,
};

export type DeleteSessionByIdParamsType = Static<
  typeof deleteSessionByIdParamsSchema
>;
