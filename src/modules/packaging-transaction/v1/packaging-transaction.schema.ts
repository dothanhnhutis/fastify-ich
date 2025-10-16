import z from "zod/v4";

const packagingTransactionParamsSchema = z.object({
  id: z.string(),
});

const createPackagingTransactionBaseBody = z.object({
  from_warehouse_id: z
    .string("Mã kho hàng phải là chuỗi.")
    .trim()
    .min(1, "Mã kho hàng không được bỏ trống."),
  note: z.string("Ghi chú phải là chuỗi.").default(""),
  transaction_date: z.iso.datetime({
    error: (ctx) => {
      if (ctx.code === "invalid_type") return "Ngày lập phiếu phải là chuỗi.";
      if (ctx.code === "invalid_format")
        return "Ngày lập phiếu phải là chuỗi date-time. ex: 2025-09-05T01:28:57Z";
    },
  }),
  status: z.enum(
    ["DRAFT", "CREATED", "COMPLETED"],
    `Trạng thái phiếu phải là 'DRAFT', 'CREATED' hoặc 'COMPLETED'.`
  ),
  items: z
    .array(
      z.object({
        packaging_id: z.string("Mã bao bì phải là chuỗi."),
        quantity: z
          .int("Số lượng phải là số nguyên.")
          .min(1, "Số lượng phải >=1"),
      }),
      "Danh sách bao bì phải là mãng."
    )
    .min(1, "Danh sách bao bì không được bỏ trống."),
});

const createPackagingTransactionImportBody =
  createPackagingTransactionBaseBody.extend({
    type: z.literal(
      "IMPORT",
      "Loại phiếu phải là 'IMPORT', 'EXPORT', 'ADJUST' hoặc 'TRANSFER'."
    ),
  });

const createPackagingTransactionExportBody =
  createPackagingTransactionBaseBody.extend({
    type: z.literal(
      "EXPORT",
      "Loại phiếu phải là 'IMPORT', 'EXPORT', 'ADJUST' hoặc 'TRANSFER'."
    ),
  });

const createPackagingTransactionAdjustBody =
  createPackagingTransactionBaseBody.extend({
    type: z.literal(
      "ADJUST",
      "Loại phiếu phải là 'IMPORT', 'EXPORT', 'ADJUST' hoặc 'TRANSFER'."
    ),
  });

const createPackagingTransactionTransferBody =
  createPackagingTransactionBaseBody.extend({
    type: z.literal(
      "TRANSFER",
      "Loại phiếu phải là 'IMPORT', 'EXPORT', 'ADJUST' hoặc 'TRANSFER'."
    ),
    to_warehouse_id: z
      .string("Mã kho đích phải là chuỗi.")
      .trim()
      .min(1, "Mã kho đích không được bỏ trống."),
  });

const createPackagingTransactionBody = z.discriminatedUnion("type", [
  createPackagingTransactionImportBody,
  createPackagingTransactionExportBody,
  createPackagingTransactionAdjustBody,
  createPackagingTransactionTransferBody,
]);

export const packagingTransactionSchema = {
  create: {
    body: createPackagingTransactionBody,
  },
  getById: {
    params: packagingTransactionParamsSchema,
  },
  getDetailById: {
    params: packagingTransactionParamsSchema,
  },
};

export type PackagingTransactionRequestType = {
  Create: {
    Body: z.infer<typeof createPackagingTransactionBody>;
  };
  GetById: {
    Params: z.infer<typeof packagingTransactionParamsSchema>;
  };
  GetItemsById: {
    Params: z.infer<typeof packagingTransactionParamsSchema>;
    Query: any;
  };
  GetDetailById: {
    Params: z.infer<typeof packagingTransactionParamsSchema>;
  };
  UpdateById: {
    Params: z.infer<typeof packagingTransactionParamsSchema>;
    Body: any;
  };
};

export type PackagingTransactionDBType = {
  create:
    | (Omit<z.infer<typeof createPackagingTransactionImportBody>, "items"> & {
        items: {
          warehouse_id: string;
          packaging_id: string;
          quantity: number;
          signed_quantity: number;
        }[];
      })
    | (Omit<z.infer<typeof createPackagingTransactionExportBody>, "items"> & {
        items: {
          warehouse_id: string;
          packaging_id: string;
          quantity: number;
          signed_quantity: number;
        }[];
      })
    | (Omit<z.infer<typeof createPackagingTransactionAdjustBody>, "items"> & {
        items: {
          warehouse_id: string;
          packaging_id: string;
          quantity: number;
          signed_quantity: number;
        }[];
      })
    | (Omit<z.infer<typeof createPackagingTransactionTransferBody>, "items"> & {
        items: {
          warehouse_id: string;
          packaging_id: string;
          quantity: number;
          signed_quantity: number;
        }[];
      });
};
