import {
  buildSortField,
  queryParamToArray,
  queryParamToString,
  queryStringSchema,
} from "@shared/utils/validate";
import z from "zod/v4";

const packagingParamsSchema = z.object({
  id: z.string(),
});

const sortWarehouseEnum = buildSortField([
  "name",
  "address",
  "status",
  "deactived_at",
  "created_at",
  "updated_at",
  "quantity",
]);

const queryStringWarehousesByPackagingIdSchema = queryStringSchema
  .extend({
    name: queryParamToString.pipe(z.string("Tên kho hàng phải là chuỗi.")),
    address: queryParamToString.pipe(z.string("Địa chỉ kho phải là chuỗi.")),
    status: queryParamToString.pipe(
      z.enum(
        ["ACTIVE", "INACTIVE"],
        `Trạng thái phải là một trong 'ACTIVE', 'INACTIVE'.}`
      )
    ),
    sort: queryParamToArray.pipe(
      z.array(
        z.enum(
          sortWarehouseEnum,
          `sort phải là một trong: ${sortWarehouseEnum.join(", ")}`
        )
      )
    ),
  })
  .partial();

const sortEnum = buildSortField([
  "name",
  "min_stock_level",
  "unit",
  "pcs_ctn",
  "status",
  "deactived_at",
  "created_at",
  "updated_at",
  "warehouse_count",
  "total_quantity",
]);

const queryStringPackagingsSchema = queryStringSchema
  .extend({
    name: queryParamToString.pipe(z.string("Tên bao bì phải là chuỗi.")),
    unit: queryParamToString.pipe(
      z.enum(["PIECE", "CARTON"], `Loại bao bì phải là 'PIECE' hoặc 'CARTON'.`)
    ),
    status: z.enum(
      ["ACTIVE", "INACTIVE"],
      `Trạng thái phải là 'ACTIVE' hoặc 'INACTIVE'.`
    ),
    sort: queryParamToArray.pipe(
      z.array(
        z.enum(sortEnum, `sort phải là một trong: ${sortEnum.join(", ")}`)
      )
    ),
  })
  .partial();

const createPackagingPieceBodySchema = z
  .object({
    name: z
      .string("Tên bao bì phải là chuỗi.")
      .trim()
      .min(1, "Tên bao bì không được bỏ trống."),
    min_stock_level: z
      .int("Mức tồn kho tối thiểu phải là số nguyên.")
      .min(1, "Mức tồn kho tối thiểu phải là số nguyên dương.")
      .optional(),
    unit: z.literal("PIECE", `Loại bao bì phải là 'PIECE' hoặc 'CARTON'.}`),
    warehouseIds: z
      .array(
        z.string("Mã kho hàng phải là chuỗi."),
        "Danh sách mã kho hàng phải là mãng."
      )
      .min(1, "Danh sách mã kho hàng phải có ít nhất 1 phần tử.")
      .optional(),
  })
  .strict();

const createPackagingCartonBodySchema = z
  .object({
    name: z
      .string("Tên bao bì phải là chuỗi.")
      .trim()
      .min(1, "Tên bao bì không được bỏ trống."),
    min_stock_level: z
      .int("Mức tồn kho tối thiểu phải là số nguyên.")
      .min(1, "Mức tồn kho tối thiểu phải là số nguyên dương.")
      .optional(),
    unit: z.literal("CARTON", `Loại bao bì phải là 'PIECE' hoặc 'CARTON'.}`),
    pcs_ctn: z
      .int("Quy cách phải là số nguyên.")
      .min(1, "Quy cách phải là số nguyên dương."),
    warehouseIds: z
      .array(
        z.string("Mã kho hàng phải là chuỗi."),
        "Danh sách mã kho hàng phải là mãng."
      )
      .min(1, "Danh sách mã kho hàng phải có ít nhất 1 phần tử.")
      .optional(),
  })
  .strict();

const createPackagingBodySchema = z.discriminatedUnion("unit", [
  createPackagingPieceBodySchema,
  createPackagingCartonBodySchema,
]);

const updatePackagingByIdBodySchema = z
  .object({
    name: z
      .string("Tên bao bì phải là chuỗi.")
      .trim()
      .min(1, "Tên bao bì không được bỏ trống."),
    min_stock_level: z
      .int("Mức tồn kho tối thiểu phải là số nguyên.")
      .min(1, "Mức tồn kho tối thiểu phải là số nguyên dương."),
    unit: z.enum(
      ["PIECE", "CARTON"],
      `Loại bao bì phải là một trong 'PIECE', 'CARTON'.`
    ),
    pcs_ctn: z
      .int("Quy cách phải là số nguyên.")
      .min(1, "Quy cách phải là số nguyên dương.")
      .nullable(),
    status: z.enum(
      ["ACTIVE", "INACTIVE"],
      "Trạng thái phải là một trong 'ACTIVE', 'INACTIVE'."
    ),
    warehouseIds: z.array(
      z.string("Mã kho hàng phải là chuỗi."),
      "Danh sách mã kho hàng phải là mãng."
    ),
  })
  .partial();

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
    body: createPackagingBodySchema,
  },
  updateById: {
    params: packagingParamsSchema,
    body: updatePackagingByIdBodySchema,
  },
  updateImageById: {
    params: packagingParamsSchema,
  },
};

export type PackagingRequestType = {
  Query: {
    Querystring: z.infer<typeof queryStringPackagingsSchema>;
  };
  GetById: {
    Params: z.infer<typeof packagingParamsSchema>;
  };
  GetWarehousesById: {
    Params: z.infer<typeof packagingParamsSchema>;
    Querystring: z.infer<typeof queryStringWarehousesByPackagingIdSchema>;
  };
  GetDetailById: {
    Params: z.infer<typeof packagingParamsSchema>;
  };
  Create: {
    Body: z.infer<typeof createPackagingBodySchema>;
  };
  UpdateById: {
    Params: z.infer<typeof packagingParamsSchema>;
    Body: z.infer<typeof updatePackagingByIdBodySchema>;
  };
  UpdateImageById: {
    Params: z.infer<typeof packagingParamsSchema>;
  };
};
