import { Type, Static } from "@sinclair/typebox";

// copy sortRoleEnum from role.schema.ts
const sortRoleEnum = [
  "name.asc",
  "name.desc",
  "permissions.asc",
  "permissions.desc",
  "description.asc",
  "description.desc",
  "status.asc",
  "status.desc",
  "created_at.asc",
  "created_at.desc",
  "updated_at.asc",
  "updated_at.desc",
];
// copy queryStringRolesSchema from role.schema.ts
export const queryStringRolesSchema = Type.Partial(
  Type.Object({
    name: Type.String({
      errorMessage: {
        type: "Tên vai trò phải là chuỗi.",
      },
    }),
    permissions: Type.Array(
      Type.String({
        errorMessage: {
          type: "Quyền phải là chuỗi.",
        },
      }),
      {
        errorMessage: {
          type: "Danh sách quyền phải là mãng.",
        },
      }
    ),
    description: Type.String({
      errorMessage: {
        type: "Mô tả phải là chuỗi.",
      },
    }),
    status: Type.String({
      enum: ["ACTIVE", "INACTIVE"],
      errorMessage: {
        type: "Trạng thái phải là chuỗi.",
        enum: `Trạng thái phải là một trong 'ACTIVE', 'INACTIVE'.}`,
      },
    }),
    created_from: Type.String({
      pattern:
        "^(?:\\d{4}-\\d{2}-\\d{2}|(?:\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})))$",
      errorMessage: {
        type: "created_from phải là chuỗi.",
        pattern:
          "created_from phải có định dạng YYYY-MM-DD hoặc date-time RFC3339.",
      },
    }),
    created_to: Type.String({
      pattern:
        "^(?:\\d{4}-\\d{2}-\\d{2}|(?:\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})))$",
      errorMessage: {
        type: "created_to phải là chuỗi.",
        pattern:
          "created_to phải có định dạng YYYY-MM-DD hoặc date-time RFC3339.",
      },
    }),
    sort: Type.Array(
      Type.String({
        enum: sortRoleEnum,
        errorMessage: {
          type: "sort phải là chuỗi.",
          enum: `sort phải là một trong: ${sortRoleEnum.join(", ")}`,
        },
      })
    ),
    limit: Type.Integer({
      minimum: 1,
      maximum: 50,
      errorMessage: {
        type: "limit phải là số nguyên.",
        minimum: "limit quá nhỏ (min >= 1).",
        maximum: "limit quá lớn (max <= 50).",
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

const createBodySchema = Type.Object({
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
  roleIds: Type.Optional(
    Type.Array(
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
    )
  ),
  password: Type.Optional(
    Type.String({
      minLength: 8,
      maxLength: 125,
      pattern:
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]+$",
      errorMessage: {
        type: "Mật khẩu phải là chuỗi.",
        minLength: "Mật khẩu quá ngắn.",
        maxLength: "Mật khẩu quá dài.",
        pattern:
          "Mật khẩu phải có chữ hoa, chữ thường, chữ số và ký tự đặc biệt'@$!%*?&'. Ex: Abc@123123",
      },
    })
  ),
});

const updateByIdBodySchema = Type.Partial(
  Type.Object({
    status: Type.String({
      enum: ["ACTIVE", "INACTIVE"],
      errorMessage: {
        type: "Trạng thái phải là chuỗi.",
        enum: `Trạng thái phải là một trong 'ACTIVE', 'INACTIVE'.`,
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
  "status.asc",
  "status.desc",
  "deactived_at.asc",
  "deactived_at.desc",
  "created_at.asc",
  "created_at.desc",
  "updated_at.asc",
  "updated_at.desc",
];

const queryStringUsersSchema = Type.Partial(
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
    status: Type.String({
      enum: ["ACTIVE", "INACTIVE"],
      errorMessage: {
        type: "Trạng thái phải là chuỗi.",
        enum: `Trạng thái phải là một trong 'ACTIVE', 'INACTIVE'.}`,
      },
    }),
    created_from: Type.String({
      pattern:
        "^(?:\\d{4}-\\d{2}-\\d{2}|(?:\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})))$",
      errorMessage: {
        type: "created_from phải là chuỗi.",
        pattern:
          "created_from phải có định dạng YYYY-MM-DD hoặc date-time RFC3339.",
      },
    }),
    created_to: Type.String({
      pattern:
        "^(?:\\d{4}-\\d{2}-\\d{2}|(?:\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})))$",
      errorMessage: {
        type: "created_to phải là chuỗi.",
        pattern:
          "created_to phải có định dạng YYYY-MM-DD hoặc date-time RFC3339.",
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
        maximum: "limit quá lớn (max <= 50).",
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

const userIdParamSchema = Type.Object({
  id: Type.String(),
});

export const userSchema = {
  query: {
    querystring: queryStringUsersSchema,
  },
  getById: {
    params: userIdParamSchema,
  },
  getRolesById: {
    params: userIdParamSchema,
    querystring: queryStringRolesSchema,
  },
  getDetailById: {
    params: userIdParamSchema,
  },
  create: {
    body: createBodySchema,
  },
  updateById: {
    params: userIdParamSchema,
    body: updateByIdBodySchema,
  },
};

export type UserRequsetType = {
  Query: {
    Querystring: Static<typeof queryStringUsersSchema>;
  };
  GetById: { Params: Static<typeof userIdParamSchema> };
  GetRolesById: {
    Params: Static<typeof userIdParamSchema>;
    Querystring: Static<typeof queryStringRolesSchema>;
  };
  GetDetailById: { Params: Static<typeof userIdParamSchema> };
  Create: {
    Body: Static<typeof createBodySchema>;
  };
  UpdateById: {
    Params: Static<typeof userIdParamSchema>;
    Body: Static<typeof updateByIdBodySchema>;
  };
};
