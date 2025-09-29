import { FastifySchema } from "fastify";
import { Type, Static } from "@sinclair/typebox";
import { queryStringSchema, userSchema } from "../users/user.schema";

const paramsIdSchema = Type.Object({
  id: Type.String(),
});

export const getUsersByRoleIdSchema: FastifySchema = {
  params: paramsIdSchema,
  querystring: userSchema["query"]["querystring"],
};

export const getRoleDetailByIdSchema: FastifySchema = {
  params: paramsIdSchema,
};

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

export const roleSchema = {
  query: {
    querystring: queryStringRolesSchema,
  },
  getById: {
    params: paramsIdSchema,
  },
  getUsersById: {
    querystring: queryStringSchema,
    params: paramsIdSchema,
  },
  getDetailById: {
    params: paramsIdSchema,
  },
  create: {
    body: createNewRoleBodySchema,
  },
  updateById: {
    params: paramsIdSchema,
    body: updateRoleByIdBodySchema,
  },
  deleteById: {
    params: paramsIdSchema,
  },
};

export type RoleRequestType = {
  Query: {
    Querystring: Static<typeof queryStringRolesSchema>;
  };
  GetById: {
    Params: Static<typeof paramsIdSchema>;
  };
  GetUsersById: {
    Querystring: Static<typeof queryStringSchema>;
    Params: Static<typeof paramsIdSchema>;
  };
  GetDetailById: {
    Params: Static<typeof paramsIdSchema>;
  };
  Create: {
    Body: Static<typeof createNewRoleBodySchema>;
  };
  UpdateById: {
    Params: Static<typeof paramsIdSchema>;
    Body: Static<typeof updateRoleByIdBodySchema>;
  };
  DeletaById: {
    Params: Static<typeof paramsIdSchema>;
  };
};
