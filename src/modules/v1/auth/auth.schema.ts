import { FastifySchema } from "fastify";
import { Type, Static } from "@sinclair/typebox";

const SignInBodySchema = Type.Object({
  email: Type.String({
    format: "email",
    errorMessage: {
      type: "Email phải là chuỗi",
      format: "Email không đúng định dạng",
    },
  }),
  password: Type.String({
    minLength: 8,
    maxLength: 125,
    pattern:
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]+$",
    errorMessage: {
      type: "Mật khẩu phải là chuỗi",
      minLength: "Email và mật khẩu không hợp lệ.",
      maxLength: "Email và mật khẩu không hợp lệ.",
      pattern: "Email và mật khẩu không hợp lệ.",
    },
  }),
});

export const signInSchema: FastifySchema = {
  body: SignInBodySchema,
};

export type SignInBodyType = Static<typeof SignInBodySchema>;
