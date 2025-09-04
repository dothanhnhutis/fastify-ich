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

const updateUserByIdBodySchema = Type.Partial(
  Type.Object({
    disable: Type.Boolean({
      errorMessage: {
        type: "Trạng thái phải là boolean.",
      },
    }),
    roleIds: Type.Array(
      Type.String({
        errorMessage: {
          type: "Phần tử của mã vai trò phải là chuỗi.",
        },
      }),
      {
        errorMessage: {
          type: "Mã vai trò phải là mảng.",
        },
      }
    ),
    username: Type.String({
      errorMessage: {
        type: "Tên người dùng phải là chuỗi.",
      },
    }),
  })
);

const sortEnum = [
  "username.asc",
  "username.desc",
  "email.asc",
  "email.desc",
  "disable.asc",
  "disable.desc",
];
const queryStringUserSchema = Type.Partial(
  Type.Object({
    username: Type.String({
      errorMessage: {
        type: "Tên người dùng phải là chuỗi.",
      },
    }),
    email: Type.String({
      format: "email",
      errorMessage: {
        type: "Email phải là chuỗi.",
        format: "Email không đúng định dạng.",
      },
    }),
    disabled: Type.Boolean({
      errorMessage: {
        type: "Trạng thái phải là boolean.",
      },
    }),
    sort: Type.Array(
      Type.String({
        enum: sortEnum,
        errorMessage: {
          type: "sort phải là chuỗi.",
          enum: `sort phải là một trong: ${sortEnum.join(", ")}`,
        },
      })
    ),
    limit: Type.Integer({
      minimum: 1,
      maximum: 50,
      errorMessage: {
        type: "limit phải là số nguyên.",
        minimum: "limit quá nhỏ (min >= 1).",
        maximum: "limit quá lớn (max >= 50).",
      },
    }),
    page: Type.Integer({
      minimum: 1,
      errorMessage: {
        type: "limit phải là số nguyên.",
        minimum: "limit quá nhỏ (min >= 1).",
      },
    }),
  })
);

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

export const queryUsersSchema: FastifySchema = {
  querystring: queryStringUserSchema,
};

export type CreateNewUserBodyType = Static<typeof createNewUserBodySchema>;

export type UpdateUserByIdParamsType = Static<typeof paramsIdSchema>;
export type UpdateUserByIdBodyType = Static<typeof updateUserByIdBodySchema>;

export type QueryUsersType = Static<typeof queryStringUserSchema>;
