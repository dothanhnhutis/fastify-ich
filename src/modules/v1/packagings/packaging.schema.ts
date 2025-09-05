import { Static, Type } from "@sinclair/typebox";
import { FastifySchema } from "fastify";

const sortEnum = ["name.asc", "name.desc", "deleted.asc", "deleted.desc"];

const queryStringWarehouseSchema = Type.Partial(
  Type.Object({
    name: Type.String({
      errorMessage: {
        type: "Tên bao bì phải là chuỗi.",
      },
    }),
    deleted: Type.Boolean({
      errorMessage: {
        type: "Trạng thái bao bì phải là boolean.",
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

const createPackagingBodySchema = Type.Object({
  name: Type.String({
    minLength: 1,
    errorMessage: {
      type: "Tên bao bì phải là chuỗi.",
      minLength: "Tên bao bì không được bỏ trống.",
    },
  }),
  warehouseIds: Type.Optional(
    Type.Array(
      Type.String({
        errorMessage: {
          type: "Mã kho hàng phải là chuỗi.",
        },
      }),
      {
        errorMessage: {
          type: "Mã kho hàng phải là mãng.",
        },
      }
    )
  ),
});

const updatePackagingBodySchema = Type.Partial(
  Type.Object({
    name: Type.String({
      minLength: 1,
      errorMessage: {
        type: "Tên bao bì phải là chuỗi.",
        minLength: "Tên bao bì không được bỏ trống.",
      },
    }),
    warehouseIds: Type.Array(
      Type.String({
        errorMessage: {
          type: "Mã kho hàng phải là chuỗi.",
        },
      }),
      {
        errorMessage: {
          type: "Mã kho hàng phải là mãng.",
        },
      }
    ),
  })
);

const packagingParamsSchema = Type.Object({
  id: Type.String({
    errorMessage: {
      type: "Mã bao bì phải là chuỗi.",
    },
  }),
});

export const queryPackagingsSchema: FastifySchema = {
  querystring: queryStringWarehouseSchema,
};
export const getPackagingByIdSchema: FastifySchema = {
  params: packagingParamsSchema,
};

export const createPackagingSchema: FastifySchema = {
  body: createPackagingBodySchema,
};

export const updatePackagingByIdSchema: FastifySchema = {
  params: packagingParamsSchema,
  body: updatePackagingBodySchema,
};

export const deletePackagingByIdSchema: FastifySchema = getPackagingByIdSchema;

export type GetPackagingByIdType = Static<typeof packagingParamsSchema>;

export type QueryPackagingsType = Static<typeof queryStringWarehouseSchema>;
export type CreatePackagingBodyType = Static<typeof createPackagingBodySchema>;

export type UpdatePackagingByIdParamsType = Static<
  typeof packagingParamsSchema
>;
export type UpdatePackagingByIdBodyType = Static<
  typeof updatePackagingBodySchema
>;

export type DeletePackagingParamsType = Static<typeof packagingParamsSchema>;
