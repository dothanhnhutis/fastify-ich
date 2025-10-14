import z from "zod/v4";
import {
  queryStringRolesSchema,
  queryStringUsersSchema,
} from "../global.schema";

const roleIdParamSchema = z.object({
  id: z.string(),
});

const createNewRoleBodySchema = z.object({
  name: z
    .string("Tên vai trò phải là chuỗi.")
    .trim()
    .min(1, "Tên vai trò không được trống"),
  description: z.string("Mô tả vai trò phải là chuỗi.").default(""),
  permissions: z
    .array(z.string("Quyền phải là chuỗi."), "Danh sách quyền phải là mãng.")
    .default([]),
});

const updateRoleByIdBodySchema = z.object({
  name: z
    .string("Tên vai trò phải là chuỗi.")
    .trim()
    .min(1, "Tên vai trò không được trống"),
  description: z.string("Mô tả vai trò phải là chuỗi."),
  permissions: z.array(
    z.string("Quyền phải là chuỗi."),
    "Danh sách quyền phải là mãng."
  ),
  status: z.enum(
    ["ACTIVE", "INACTIVE"],
    "Trạng thái phải là một trong 'ACTIVE', 'INACTIVE'."
  ),
});

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
    Querystring: z.infer<typeof queryStringRolesSchema>;
  };
  GetById: {
    Params: z.infer<typeof roleIdParamSchema>;
  };
  GetUsersById: {
    Querystring: z.infer<typeof queryStringUsersSchema>;
    Params: z.infer<typeof roleIdParamSchema>;
  };
  GetDetailById: {
    Params: z.infer<typeof roleIdParamSchema>;
  };
  Create: {
    Body: z.infer<typeof createNewRoleBodySchema>;
  };
  UpdateById: {
    Params: z.infer<typeof roleIdParamSchema>;
    Body: z.infer<typeof updateRoleByIdBodySchema>;
  };
  DeletaById: {
    Params: z.infer<typeof roleIdParamSchema>;
  };
};
