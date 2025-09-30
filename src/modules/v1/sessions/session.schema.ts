import { Static, Type } from "@sinclair/typebox";

const sessionIdParamSchema = Type.Object({
  id: Type.String(),
});

export const sessionSchema = {
  deleteById: {
    params: sessionIdParamSchema,
  },
};

export type SessionRequestType = {
  DeleteById: {
    Params: Static<typeof sessionIdParamSchema>;
  };
};
