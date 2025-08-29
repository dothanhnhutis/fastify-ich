import { FastifySchema } from "fastify";
import { Type, Static } from "@sinclair/typebox";

const createNewRoleBodySchema = Type.Object({
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
      default: "",
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
        default: [],
      }
    )
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
  })
);

const paramsIdSchema = Type.Object({
  id: Type.String(),
});

const queryRoles = Type.Partial(
  Type.Object({
    name: Type.String(),
    permissions: Type.Array(Type.String()),
    description: Type.String(),
    sorts: Type.Array(Type.String({ enum: ["price:asc", "price:desc"] })),
    limit: Type.Integer(),
    page: Type.Integer(),
  })
);

export const createNewRoleSchema: FastifySchema = {
  body: createNewRoleBodySchema,
};

export const getRoleByIdSchema: FastifySchema = {
  params: paramsIdSchema,
};

export const deleteRoleByIdSchema: FastifySchema = getRoleByIdSchema;

export const updateRoleByIdSchema: FastifySchema = {
  params: paramsIdSchema,
  body: updateRoleByIdBodySchema,
};

export const queryRoleSchema: FastifySchema = {
  querystring: queryRoles,
};

export type CreateNewRoleBodyType = Static<typeof createNewRoleBodySchema>;
export type GetRoleByIdParamsType = Static<typeof paramsIdSchema>;
export type DeleteRoleByIdParamsType = Static<typeof paramsIdSchema>;
export type UpdateRoleByIdParamsType = Static<typeof paramsIdSchema>;
export type UpdateRoleByIdBodyType = Static<typeof updateRoleByIdBodySchema>;
export type QueryRolesType = Static<typeof queryRoles>;
