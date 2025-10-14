import z from "zod/v4";

const sessionIdParamSchema = z.object({
  id: z.string(),
});

export const sessionSchema = {
  deleteById: {
    params: sessionIdParamSchema,
  },
};

export type SessionRequestType = {
  DeleteById: {
    Params: z.infer<typeof sessionIdParamSchema>;
  };
};
