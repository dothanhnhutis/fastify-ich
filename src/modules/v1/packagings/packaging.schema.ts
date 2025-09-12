import { Static, Type } from "@sinclair/typebox";
import { FastifySchema } from "fastify";

const packagingParamsSchema = Type.Object({
  id: Type.String({
    errorMessage: {
      type: "Mã bao bì phải là chuỗi.",
    },
  }),
});

const sortWarehouseEnum = [
  "name.asc",
  "name.desc",
  "address.asc",
  "address.desc",
  "status.asc",
  "status.desc",
  "deactived_at.asc",
  "deactived_at.desc",
  "created_at.asc",
  "created_at.desc",
  "updated_at.asc",
  "updated_at.desc",
  "quantity.asc",
  "quantity.desc",
];

const queryStringWarehousesByPackagingIdSchema = Type.Partial(
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
        enum: sortWarehouseEnum,
        errorMessage: {
          type: "sort phải là chuỗi.",
          enum: `sort phải là một trong: ${sortWarehouseEnum.join(", ")}`,
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
  "min_stock_level.asc",
  "min_stock_level.desc",
  "unit.asc",
  "unit.desc",
  "pcs_ctn.asc",
  "pcs_ctn.desc",
  "status.asc",
  "status.desc",
  "deactived_at.asc",
  "deactived_at.desc",
  "created_at.asc",
  "created_at.desc",
  "updated_at.asc",
  "updated_at.desc",
  "warehouse_count.asc",
  "warehouse_count.desc",
  "total_quantity.asc",
  "total_quantity.desc",
];

const queryStringPackagingsSchema = Type.Partial(
  Type.Object({
    name: Type.String({
      errorMessage: {
        type: "Tên bao bì phải là chuỗi.",
      },
    }),
    unit: Type.String({
      enum: ["PIECE", "CARTON"],
      errorMessage: {
        type: "Loại bao bì phải là chuỗi.",
        enum: `Loại bao bì phải là 'PIECE' hoặc 'CARTON'.}`,
      },
    }),
    status: Type.String({
      enum: ["ACTIVE", "INACTIVE"],
      errorMessage: {
        type: "Trạng thái phải là chuỗi.",
        enum: `Trạng thái phải là 'ACTIVE' hoặc 'INACTIVE'.}`,
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
        minLength: 1,
        errorMessage: {
          type: "Mã kho hàng phải là chuỗi.",
          minLength: "Mã kho hàng không được trống.",
        },
      }),
      {
        errorMessage: {
          type: "Mã kho hàng phải là mãng.",
        },
      }
    ),
    isDelete: Type.Boolean({
      errorMessage: {
        type: "Xoá bao bì phải là boolean.",
      },
    }),
  })
);

export const getWarehousesByPackagingIdSchema: FastifySchema = {
  params: packagingParamsSchema,
  querystring: queryStringWarehousesByPackagingIdSchema,
};

export const queryPackagingsSchema: FastifySchema = {
  querystring: queryStringPackagingsSchema,
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

export type GetWarehousesByPackagingIdParamsType = Static<
  typeof packagingParamsSchema
>;
export type GetWarehousesByPackagingIdQueryType = Static<
  typeof queryStringWarehousesByPackagingIdSchema
>;

export type QueryPackagingsType = Static<typeof queryStringPackagingsSchema>;
export type GetPackagingByIdType = Static<typeof packagingParamsSchema>;

export type CreatePackagingBodyType = Static<typeof createPackagingBodySchema>;

export type UpdatePackagingByIdParamsType = Static<
  typeof packagingParamsSchema
>;
export type UpdatePackagingByIdBodyType = Static<
  typeof updatePackagingBodySchema
>;

export type DeletePackagingParamsType = Static<typeof packagingParamsSchema>;
