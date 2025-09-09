import { FastifySchema } from "fastify";
import { Type, Static } from "@sinclair/typebox";

const sortPackagingEnum = [
  "name.asc",
  "name.desc",
  "deleted.asc",
  "deleted.desc",
  "created_at.asc",
  "created_at.desc",
  "updated_at.asc",
  "updated_at.desc",
  "quantity.asc",
  "quantity.desc",
];
export const queryStringPackagingByWarehouseIdSchema = Type.Partial(
  Type.Object({
    name: Type.String({
      errorMessage: {
        type: "Tên kho hàng phải là chuỗi.",
      },
    }),
    deleted: Type.Boolean({
      errorMessage: {
        type: "Trạng thái kho hàng phải là boolean.",
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
        enum: sortPackagingEnum,
        errorMessage: {
          type: "sort phải là chuỗi.",
          enum: `sort phải là một trong: ${sortPackagingEnum.join(", ")}`,
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

const sortEnum = [
  "name.asc",
  "name.desc",
  "address.asc",
  "address.desc",
  "deleted.asc",
  "deleted.desc",
  "created_at.asc",
  "created_at.desc",
  "updated_at.asc",
  "updated_at.desc",
];

const queryStringWarehouseSchema = Type.Partial(
  Type.Object({
    name: Type.String({
      errorMessage: {
        type: "Tên kho hàng phải là chuỗi.",
      },
    }),
    address: Type.String({
      errorMessage: {
        type: "Địa chỉ kho phải là chuỗi.",
      },
    }),
    deleted: Type.Boolean({
      errorMessage: {
        type: "Trạng thái kho phải là boolean.",
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

const createWarehouseBodySchema = Type.Object({
  name: Type.String({
    minLength: 1,
    errorMessage: {
      type: "Tên kho hàng phải là chuỗi.",
      minLength: "Tên kho hàng không được trống.",
    },
  }),
  address: Type.String({
    minLength: 1,
    errorMessage: {
      type: "Địa chỉ kho hàng phải là chuỗi.",
      minLength: "Địa chỉ kho hàng không được trống.",
    },
  }),
  packagingIds: Type.Optional(
    Type.Array(
      Type.String({
        errorMessage: {
          type: "Mã bao bì phải là chuỗi.",
        },
      }),
      {
        errorMessage: {
          type: "Mã bao bì phải là mãng.",
        },
      }
    )
  ),
});

const updateWarehouseByIdBodySchema = Type.Partial(
  Type.Object({
    name: Type.String({
      minLength: 1,
      errorMessage: {
        type: "Tên kho hàng phải là chuỗi.",
        minLength: "Tên kho hàng không được trống.",
      },
    }),
    address: Type.String({
      minLength: 1,
      errorMessage: {
        type: "Địa chỉ kho hàng phải là chuỗi.",
        minLength: "Địa chỉ kho hàng không được trống.",
      },
    }),
    packagingIds: Type.Array(
      Type.String({
        minLength: 1,
        errorMessage: {
          type: "Mã bao bì phải là chuỗi.",
          minLength: "Mã bao bì không được trống.",
        },
      }),
      {
        errorMessage: {
          type: "Mã bao bì phải là mãng.",
        },
      }
    ),
    isDelete: Type.Boolean({
      errorMessage: {
        type: "Xoá kho hàng phải là boolean.",
      },
    }),
  })
);

const warehouseParamsSchema = Type.Object({
  id: Type.String(),
});

export const getWarehouseByIdSchema: FastifySchema = {
  params: warehouseParamsSchema,
};

export const getPackagingsByWarehouseIdSchema: FastifySchema = {
  params: warehouseParamsSchema,
  querystring: queryStringPackagingByWarehouseIdSchema,
};

export const createWarehouseSchema: FastifySchema = {
  body: createWarehouseBodySchema,
};

export const updateWarehouseByIdSchema: FastifySchema = {
  params: warehouseParamsSchema,
  body: updateWarehouseByIdBodySchema,
};

export const deleteWarehouseByIdSchema: FastifySchema = {
  params: warehouseParamsSchema,
};

export const queryWarehousesSchema: FastifySchema = {
  querystring: queryStringWarehouseSchema,
};

export type GetPackagingsByWarehouseIdParamsType = Static<
  typeof warehouseParamsSchema
>;
export type GetPackagingsByWarehouseIdQueryType = Static<
  typeof queryStringPackagingByWarehouseIdSchema
>;

export type GetWarehouseByIdParamsType = Static<typeof warehouseParamsSchema>;
export type CreateWarehouseBodyType = Static<typeof createWarehouseBodySchema>;

export type UpdateWarehouseByIdParamsType = Static<
  typeof warehouseParamsSchema
>;
export type UpdateWarehouseByIdBodyType = Static<
  typeof updateWarehouseByIdBodySchema
>;

export type DeleteWarehouseByIdParamsType = Static<
  typeof warehouseParamsSchema
>;

export type QueryWarehousesType = Static<typeof queryStringWarehouseSchema>;
