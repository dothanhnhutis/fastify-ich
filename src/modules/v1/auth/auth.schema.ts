import { FastifySchema } from "fastify";
import { Type, Static } from "@sinclair/typebox";

const signInBodySchema = Type.Object(
  {
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
  },
  {
    additionalProperties: false,
    errorMessage: {
      required: {
        email: "không thể thiếu trường email.",
        password: "không thể thiếu trường mật khẩu.",
      },
      additionalProperties: "|",
    },
  }
);

export const authSchema = {
  signin: {
    body: signInBodySchema,
  },
};

export type AuthRequestType = {
  SignIn: {
    Body: Static<typeof signInBodySchema>;
  };
};
