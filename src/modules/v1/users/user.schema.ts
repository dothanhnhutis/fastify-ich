import { FastifySchema } from "fastify";
import { Type, Static } from "@sinclair/typebox";

const createNewUserBodySchema = Type.Object({
  username: Type.String({
    minLength: 1,
    errorMessage: {
      type: "Tên người dùng phải là chuỗi.",
      minLength: "Tên người dùng không được trống.",
    },
  }),
  email: Type.String({
    format: "email",
    errorMessage: {
      type: "Email phải là chuỗi.",
      format: "Email không đúng định dạng.",
    },
  }),
  roleIds: Type.Array(
    Type.String({
      errorMessage: {
        type: "Vai trò phải là chuỗi.",
      },
    }),
    {
      default: [],
      errorMessage: {
        type: "Danh sách vai trò phải là mảng.",
      },
    }
  ),
  //   password: Type.String({
  //     minLength: 8,
  //     maxLength: 125,
  //     pattern:
  //       "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]+$",
  //     errorMessage: {
  //       type: "Mật khẩu phải là chuỗi.",
  //       minLength: "Mật khẩu quá ngắn.",
  //       maxLength: "Mật khẩu quá dài.",
  //       pattern:
  //         "Mật khẩu phải có chữ hoa, chữ thường, chữ số và ký tự đặc biệt'@$!%*?&'. Ex: Abc@123123",
  //     },
  //   }),
});

const sortEnum = [
  "username.asc",
  "username.desc",
  "roleIds.asc",
  "roleIds.desc",
];

const updateUserByIdBodySchema = Type.Object({
  disable: Type.Boolean(),
  roleIds: Type.Array(Type.String()),
});

export const createNewUserSchema: FastifySchema = {
  body: createNewUserBodySchema,
};

const paramsIdSchema = Type.Object({
  id: Type.String(),
});

export const updateUserByIdSchema: FastifySchema = {
  params: paramsIdSchema,
  body: updateUserByIdBodySchema,
};

export type CreateNewUserBodyType = Static<typeof createNewUserBodySchema>;
export type UpdateUserByIdParamsType = Static<typeof paramsIdSchema>;
export type UpdateUserByIdBodyType = Static<typeof updateUserByIdBodySchema>;
