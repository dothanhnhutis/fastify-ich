import { FastifySchema } from "fastify";
import { Static, Type } from "@sinclair/typebox";

const deleteSessionByIdParamsSchema = Type.Object({
  id: Type.String(),
});

export const deleteSessionByIdSchema = {
  params: deleteSessionByIdParamsSchema,
};

export type DeleteSessionByIdParamsType = Static<
  typeof deleteSessionByIdParamsSchema
>;
