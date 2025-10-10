import { Type, Static } from "@sinclair/typebox";

// copy sortUserEnum from user.schema.ts
const sortUserEnum = [
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
// copy queryStringUsersSchema from user.schema.ts
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
        enum: sortUserEnum,
        errorMessage: {
          type: "sort phải là chuỗi.",
          enum: `sort phải là một trong: ${sortUserEnum.join(", ")}`,
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

const roleIdParamSchema = Type.Object({
  id: Type.String(),
});

const createNewRoleBodySchema = Type.Object({
  name: Type.String({
    errorMessage: {
      type: "Tên vai trò phải là chuỗi.",
    },
  }),
  description: Type.String({
    errorMessage: {
      type: "Mô tả vai trò phải là chuỗi.",
    },
    default: "",
  }),
  permissions: Type.Array(
    Type.String({
      errorMessage: {
        type: " Quyền phải là chuỗi.",
      },
    }),
    {
      errorMessage: {
        type: "Danh sách quyền phải là mãng.",
      },
      default: [],
    }
  ),
});

const updateRoleByIdBodySchema = Type.Partial(
  Type.Object({
    name: Type.String({
      errorMessage: {
        type: "Tên vai trò phải là chuỗi.",
      },
    }),
    description: Type.Optional(
      Type.String({
        errorMessage: {
          type: "Mô tả vai trò phải là chuỗi.",
        },
      })
    ),
    permissions: Type.Optional(
      Type.Array(
        Type.String({
          errorMessage: {
            type: " Quyền phải là chuỗi.",
          },
        }),
        {
          errorMessage: {
            type: "Danh sách quyền phải là mãng.",
          },
        }
      )
    ),
    status: Type.String({
      enum: ["ACTIVE", "INACTIVE"],
      errorMessage: {
        type: "Trạng thái phải là chuỗi.",
        enum: `Trạng thái phải là một trong 'ACTIVE', 'INACTIVE'.}`,
      },
    }),
  })
);

const sortEnum = [
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
        enum: sortEnum,
        errorMessage: {
          type: "sort phải là chuỗi.",
          enum: `sort phải là một trong: ${sortEnum.join(", ")}`,
        },
      })
    ),
    // limit: Type.Integer({
    //   minimum: 1,
    //   maximum: 50,
    //   errorMessage: {
    //     type: "limit phải là số nguyên.",
    //     minimum: "limit quá nhỏ (min >= 1).",
    //     maximum: "limit quá lớn (max <= 50).",
    //   },
    // }),
    page: Type.Integer({
      minimum: 1,
      errorMessage: {
        type: "limit phải là số nguyên.",
        minimum: "limit quá nhỏ (min >= 1).",
      },
    }),
    limit: Type.Transform(Type.String())
      .Decode((value) => Number(value))
      .Encode((value) => String(value)),
  })
);

export const roleSchema = {
  query: {
    querystring: queryStringRolesSchema,
  },
  getById: {
    params: roleIdParamSchema,
  },
  getUsersById: {
    querystring: queryStringUsersSchema,
    params: roleIdParamSchema,
  },
  getDetailById: {
    params: roleIdParamSchema,
  },
  create: {
    body: createNewRoleBodySchema,
  },
  updateById: {
    params: roleIdParamSchema,
    body: updateRoleByIdBodySchema,
  },
  deleteById: {
    params: roleIdParamSchema,
  },
};

export type RoleRequestType = {
  Query: {
    Querystring: Static<typeof queryStringRolesSchema>;
  };
  GetById: {
    Params: Static<typeof roleIdParamSchema>;
  };
  GetUsersById: {
    Querystring: Static<typeof queryStringUsersSchema>;
    Params: Static<typeof roleIdParamSchema>;
  };
  GetDetailById: {
    Params: Static<typeof roleIdParamSchema>;
  };
  Create: {
    Body: Static<typeof createNewRoleBodySchema>;
  };
  UpdateById: {
    Params: Static<typeof roleIdParamSchema>;
    Body: Static<typeof updateRoleByIdBodySchema>;
  };
  DeletaById: {
    Params: Static<typeof roleIdParamSchema>;
  };
};
