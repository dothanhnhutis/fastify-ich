import { queryStringRolesSchema } from "@modules/shared/role/role.shared.schema";
import { queryStringUsersSchema } from "@modules/shared/user/user.shared.schema";
import z from "zod/v4";

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
    .array(
      z.string("Quyền truy cập phải là chuỗi."),
      "Danh sách quyền truy cập phải là mãng chuỗi."
    )
    .default([]),
  userIds: z
    .array(
      z.string("Tài khoản phải là chuỗi."),
      "Danh sách tài khoản phải là mãng chuỗi."
    )
    .default([]),
});

const updateRoleByIdBodySchema = z
  .object({
    name: z
      .string("Tên vai trò phải là chuỗi.")
      .trim()
      .min(1, "Tên vai trò không được trống"),
    description: z.string("Mô tả vai trò phải là chuỗi."),
    permissions: z.array(
      z.string("Quyền truy cập phải là chuỗi."),
      "Danh sách quyền truy cập phải là mãng chuỗi."
    ),
    status: z.enum(
      ["ACTIVE", "INACTIVE"],
      "Trạng thái phải là một trong 'ACTIVE', 'INACTIVE'."
    ),
    userIds: z.array(
      z.string("Mã tài khoản phải là chuỗi."),
      "Danh sách tài khoản phải là mãng chuỗi."
    ),
  })
  .partial();

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
