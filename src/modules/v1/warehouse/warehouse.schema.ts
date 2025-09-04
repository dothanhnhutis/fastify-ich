import { FastifySchema } from "fastify";
import { Type, Static } from "@sinclair/typebox";

const sortEnum = [
  "name.asc",
  "name.desc",
  "address.asc",
  "address.desc",
  "deleted.asc",
  "deleted.desc",
];

const queryStringWarehouseSchema = Type.Partial(
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
        errorMessage: {
          type: "Mã bao bì phải là chuỗi.",
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

export type GetWarehouseByIdParamsType = Static<typeof warehouseParamsSchema>;
export type CreateWarehouseBodyType = Static<typeof createWarehouseBodySchema>;

export type UpdateWarehouseParamsType = Static<typeof warehouseParamsSchema>;
export type UpdateWarehouseBodyType = Static<
  typeof updateWarehouseByIdBodySchema
>;

export type DeleteWarehouseByIdParamsType = Static<
  typeof warehouseParamsSchema
>;

export type QueryWarehousesType = Static<typeof queryStringWarehouseSchema>;
