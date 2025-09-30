import { Static, Type } from "@sinclair/typebox";

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
        enum: `Loại bao bì phải là 'PIECE' hoặc 'CARTON'.`,
      },
    }),
    status: Type.String({
      enum: ["ACTIVE", "INACTIVE"],
      errorMessage: {
        type: "Trạng thái phải là chuỗi.",
        enum: `Trạng thái phải là 'ACTIVE' hoặc 'INACTIVE'.`,
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

const createPackagingPieceBodySchema = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      errorMessage: {
        type: "Tên bao bì phải là chuỗi.",
        minLength: "Tên bao bì không được bỏ trống.",
      },
    }),
    min_stock_level: Type.Optional(
      Type.Integer({
        minimum: 1,
        errorMessage: {
          type: "Mức tồn kho tối thiểu phải là số nguyên.",
          minimum: "Mức tồn kho tối thiểu phải là số nguyên dương.",
        },
      })
    ),
    unit: Type.Literal("PIECE", {
      errorMessage: {
        type: `Loại bao bì phải là 'PIECE' hoặc 'CARTON'.}`,
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
          minItems: 1,
          errorMessage: {
            type: "Danh sách mã kho hàng phải là mãng.",
            minItems: "Danh sách mã kho hàng phải có ít nhất 1 phần tử.",
          },
        }
      )
    ),
  },
  {
    errorMessage: {
      required: {
        name: "Thiếu trường 'name' bắt buộc.",
        unit: "Thiếu trường 'unit' bắt buộc.",
      },
    },
  }
);

const createPackagingCartonBodySchema = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      errorMessage: {
        type: "Tên bao bì phải là chuỗi.",
        minLength: "Tên bao bì không được bỏ trống.",
      },
    }),
    min_stock_level: Type.Optional(
      Type.Integer({
        minimum: 1,
        errorMessage: {
          type: "Mức tồn kho tối thiểu phải là số nguyên.",
          minimum: "Mức tồn kho tối thiểu phải là số nguyên dương.",
        },
      })
    ),
    unit: Type.Literal("CARTON", {
      errorMessage: {
        type: `Loại bao bì phải là 'PIECE' hoặc 'CARTON'.}`,
      },
    }),
    pcs_ctn: Type.Integer({
      minimum: 1,
      errorMessage: {
        type: "Quy cách phải là số nguyên.",
        minimum: "Quy cách phải là số nguyên dương.",
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
          minItems: 1,
          errorMessage: {
            type: "Danh sách mã kho hàng phải là mãng.",
            minItems: "Danh sách mã kho hàng phải có ít nhất 1 phần tử.",
          },
        }
      )
    ),
  },
  {
    errorMessage: {
      required: {
        name: "Thiếu trường 'name' bắt buộc.",
        unit: "Thiếu trường 'unit' bắt buộc.",
        pcs_ctn: "Thiếu trường 'pcs_ctn' bắt buộc.",
      },
    },
  }
);

const createNewPackagingBodySchema = Type.Unsafe({
  oneOf: [createPackagingPieceBodySchema, createPackagingCartonBodySchema],
  discriminator: { propertyName: "unit" },
});

const updatePackagingByIdBodySchema = Type.Partial(
  Type.Object({
    name: Type.String({
      minLength: 1,
      errorMessage: {
        type: "Tên bao bì phải là chuỗi.",
        minLength: "Tên bao bì không được bỏ trống.",
      },
    }),
    min_stock_level: Type.Optional(
      Type.Integer({
        minimum: 1,
        errorMessage: {
          type: "Mức tồn kho tối thiểu phải là số nguyên.",
          minimum: "Mức tồn kho tối thiểu phải là số nguyên dương.",
        },
      })
    ),
    unit: Type.String({
      enum: ["PIECE", "CARTON"],
      errorMessage: {
        type: "Loại bao bì phải là chuỗi.",
        enum: `Loại bao bì phải là một trong 'PIECE', 'CARTON'.`,
      },
    }),
    pcs_ctn: Type.Union([
      Type.Integer({
        minimum: 1,
        errorMessage: {
          type: "Quy cách phải là số nguyên.1",
          minimum: "Quy cách phải là số nguyên dương.1",
        },
      }),
      Type.Null(),
    ]),
    status: Type.String({
      enum: ["ACTIVE", "INACTIVE"],
      errorMessage: {
        type: "Trạng thái phải là chuỗi.",
        enum: `Trạng thái phải là một trong 'ACTIVE', 'INACTIVE'.`,
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
            type: "Danh sách mã kho hàng phải là mãng.",
          },
        }
      )
    ),
  })
);

export const packagingSchema = {
  query: {
    querystring: queryStringPackagingsSchema,
  },
  getById: {
    params: packagingParamsSchema,
  },
  getWarehousesById: {
    params: packagingParamsSchema,
    querystring: queryStringWarehousesByPackagingIdSchema,
  },
  getDetailById: {
    params: packagingParamsSchema,
  },
  create: {
    body: createNewPackagingBodySchema,
  },
  updateById: {
    params: packagingParamsSchema,
    body: updatePackagingByIdBodySchema,
  },
};

export type PackagingRequestType = {
  Query: {
    Querystring: Static<typeof queryStringPackagingsSchema>;
  };
  GetById: {
    Params: Static<typeof packagingParamsSchema>;
  };
  GetWarehousesById: {
    Params: Static<typeof packagingParamsSchema>;
    Querystring: Static<typeof queryStringWarehousesByPackagingIdSchema>;
  };
  GetDetailById: {
    Params: Static<typeof packagingParamsSchema>;
  };
  Create: {
    Body:
      | Static<typeof createPackagingPieceBodySchema>
      | Static<typeof createPackagingCartonBodySchema>;
  };
  UpdateById: {
    Params: Static<typeof packagingParamsSchema>;
    Body: Static<typeof updatePackagingByIdBodySchema>;
  };
};
