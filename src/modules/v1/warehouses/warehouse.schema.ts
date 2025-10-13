import z from "zod/v4";
import { buildSortField } from "@/shared/utils";
import {
  queryParamToArray,
  queryParamToString,
  queryStringSchema,
} from "../global.schema";

const warehouseIdParamsSchema = z.object({
  id: z.string(),
});

const sortPackagingEnum = buildSortField([
  "name",
  "min_stock_level",
  "unit",
  "pcs_ctn",
  "status",
  "deactived_at",
  "created_at",
  "updated_at",
  "quantity",
]);

export const queryStringPackagingByWarehouseIdSchema = queryStringSchema
  .extend({
    name: queryParamToString.pipe(z.string("Tên kho hàng phải là chuỗi.")),
    unit: queryParamToString.pipe(
      z.enum(["PIECE", "CARTON"], `Loại bao bì phải là 'PIECE' hoặc 'CARTON'.`)
    ),
    status: queryParamToString.pipe(
      z.enum(
        ["ACTIVE", "INACTIVE"],
        `Trạng thái phải là một trong 'ACTIVE', 'INACTIVE'.}`
      )
    ),
    sort: queryParamToArray.pipe(
      z.array(
        z.enum(
          sortPackagingEnum,
          `sort phải là một trong: ${sortPackagingEnum.join(", ")}`
        )
      )
    ),
  })
  .partial();

const sortEnum = buildSortField([
  "name",
  "address",
  "deleted",
  "created_at",
  "updated_at",
]);

const queryStringWarehouseSchema = queryStringSchema
  .extend({
    name: queryParamToString.pipe(z.string("Tên kho hàng phải là chuỗi.")),
    address: queryParamToString.pipe(z.string("Địa chỉ kho phải là chuỗi.")),
    deleted: queryParamToString.pipe(
      z.coerce.boolean("Trạng thái kho phải là boolean.")
    ),
    sort: queryParamToArray.pipe(
      z.array(
        z.enum(sortEnum, `sort phải là một trong: ${sortEnum.join(", ")}`)
      )
    ),
  })
  .partial();

const createWarehouseBodySchema = z
  .object({
    name: z
      .string("Tên kho hàng phải là chuỗi.")
      .trim()
      .min(1, "Tên kho hàng không được trống."),
    address: z
      .string("Địa chỉ kho hàng phải là chuỗi.")
      .trim()
      .min(1, "Địa chỉ kho hàng không được trống."),
    packagingIds: z
      .array(z.string("Mã bao bì phải là chuỗi."), "Mã bao bì phải là mãng.")
      .optional(),
  })
  .strict();

const updateWarehouseByIdBodySchema = z
  .object({
    name: z
      .string("Tên kho hàng phải là chuỗi.")
      .trim()
      .min(1, "Tên kho hàng không được trống."),
    address: z
      .string("Địa chỉ kho hàng phải là chuỗi.")
      .trim()
      .min(1, "Địa chỉ kho hàng không được trống."),
    packagingIds: z.array(
      z.string("Mã bao bì phải là chuỗi."),
      "Mã bao bì phải là mãng."
    ),
    status: z.enum(
      ["ACTIVE", "INACTIVE"],
      "Trạng thái phải là một trong 'ACTIVE', 'INACTIVE'."
    ),
  })
  .partial();

export const warehouseSchema = {
  query: {
    querystring: queryStringWarehouseSchema,
  },
  getById: {
    params: warehouseIdParamsSchema,
  },
  getPackagingsById: {
    querystring: queryStringPackagingByWarehouseIdSchema,
    params: warehouseIdParamsSchema,
  },
  getDetailById: {
    params: warehouseIdParamsSchema,
  },
  create: {
    body: createWarehouseBodySchema,
  },
  updateById: {
    params: warehouseIdParamsSchema,
    body: updateWarehouseByIdBodySchema,
  },
};

export type WarehouseRequestType = {
  Query: {
    Querystring: z.infer<typeof queryStringWarehouseSchema>;
  };
  GetById: {
    Params: z.infer<typeof warehouseIdParamsSchema>;
  };
  GetPackagingsById: {
    Params: z.infer<typeof warehouseIdParamsSchema>;
    Querystring: z.infer<typeof queryStringPackagingByWarehouseIdSchema>;
  };
  GetDetailById: {
    Params: z.infer<typeof warehouseIdParamsSchema>;
  };
  Create: {
    Body: z.infer<typeof createWarehouseBodySchema>;
  };
  UpdateById: {
    Params: z.infer<typeof warehouseIdParamsSchema>;
    Body: z.infer<typeof updateWarehouseByIdBodySchema>;
  };
};
