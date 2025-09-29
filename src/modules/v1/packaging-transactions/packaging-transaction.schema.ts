import { FastifySchema } from "fastify";
import { Static, Type } from "@sinclair/typebox";

const packagingTransactionParamsSchema = Type.Object({
  id: Type.String({
    errorMessage: {
      type: "Mã phiếu kho phải là chuỗi.",
    },
  }),
});

const createPackagingTransactionBaseBody = Type.Object({
  from_warehouse_id: Type.String({
    minLength: 1,
    errorMessage: {
      type: "Mã kho hàng phải là chuỗi.",
      minLength: "Mã kho hàng không được bỏ trống.",
    },
  }),
  note: Type.String({
    default: "",
    errorMessage: {
      type: "Ghi chú phải là chuỗi.",
    },
  }),
  transaction_date: Type.String({
    format: "date-time",
    errorMessage: {
      type: "Ngày lập phiếu phải là chuỗi.",
      format:
        "Ngày lập phiếu phải là chuỗi date-time. ex: 2025-09-05T01:28:57Z",
    },
  }),
  status: Type.String({
    default: "DRAFT",
    enum: ["DRAFT", "CREATED", "COMPLETED"],
    errorMessage: {
      type: "Trạng thái phiếu phải là chuỗi.",
      enum: `Trạng thái phiếu phải là 'DRAFT', 'CREATED' hoặc 'COMPLETED'.`,
    },
  }),
  items: Type.Array(
    Type.Object({
      packaging_id: Type.String({
        minLength: 1,
        errorMessage: {
          type: "Mã bao bì phải là chuỗi.",
          minLength: "Mã bao bì không được bỏ trống.",
        },
      }),
      quantity: Type.Integer({
        minimum: 1,
        errorMessage: {
          type: "Số lượng phải là số nguyên.",
          minimum: "Số lượng phải là số nguyên dương",
        },
      }),
    }),
    {
      minItems: 1,
      errorMessage: {
        type: "Danh sách bao bì phải là mãng.",
        minItems: "Danh sách bao bì không được bỏ trống.",
      },
    }
  ),
});

const createPackagingTransactionImportBody = Type.Composite([
  createPackagingTransactionBaseBody,
  Type.Object({
    type: Type.Literal("IMPORT", {
      errorMessage: {
        type: "Loại phiếu phải là 'IMPORT', 'EXPORT', 'ADJUST' hoặc 'TRANSFER'.",
      },
    }),
  }),
]);

const createPackagingTransactionExportBody = Type.Composite([
  createPackagingTransactionBaseBody,
  Type.Object({
    type: Type.Literal("EXPORT", {
      errorMessage: {
        type: "Loại phiếu phải là 'IMPORT', 'EXPORT', 'ADJUST' hoặc 'TRANSFER'.",
      },
    }),
  }),
]);

const createPackagingTransactionAdjustBody = Type.Composite([
  createPackagingTransactionBaseBody,
  Type.Object({
    type: Type.Literal("ADJUST", {
      errorMessage: {
        type: "Loại phiếu phải là 'IMPORT', 'EXPORT', 'ADJUST' hoặc 'TRANSFER'.",
      },
    }),
  }),
]);

const createPackagingTransactionTransferBody = Type.Composite([
  createPackagingTransactionBaseBody,
  Type.Object({
    type: Type.Literal("TRANSFER", {
      errorMessage: {
        type: "Loại phiếu phải là 'IMPORT', 'EXPORT', 'ADJUST' hoặc 'TRANSFER'.",
      },
    }),
    to_warehouse_id: Type.String({
      minLength: 1,
      errorMessage: {
        type: "Mã kho đích phải là chuỗi.",
        minLength: "Mã kho đích không được bỏ trống.",
      },
    }),
  }),
]);

const createPackagingTransactionBody = Type.Unsafe({
  oneOf: [
    createPackagingTransactionImportBody,
    createPackagingTransactionExportBody,
    createPackagingTransactionAdjustBody,
    createPackagingTransactionTransferBody,
  ],
  discriminator: { propertyName: "type" },
});

export class packagingTransactionSchema {
  static create = {
    body: createPackagingTransactionBody,
  };

  static getById = {
    params: packagingTransactionParamsSchema,
  };

  static getDetailById = {
    params: packagingTransactionParamsSchema,
  };
}

export type PackagingTransactionRequestType = {
  Create: {
    Body:
      | Static<typeof createPackagingTransactionImportBody>
      | Static<typeof createPackagingTransactionExportBody>
      | Static<typeof createPackagingTransactionAdjustBody>
      | Static<typeof createPackagingTransactionTransferBody>;
  };
  GetById: {
    Params: Static<typeof packagingTransactionParamsSchema>;
  };

  GetItemsById: {
    Params: Static<typeof packagingTransactionParamsSchema>;
    Query: any;
  };
  GetDetailById: {
    Params: Static<typeof packagingTransactionParamsSchema>;
  };
  UpdateById: {
    Params: Static<typeof packagingTransactionParamsSchema>;
    Body: any;
  };
};

export type PackagingTransactionDBType = {
  create:
    | (Omit<Static<typeof createPackagingTransactionImportBody>, "items"> & {
        items: {
          warehouse_id: string;
          packaging_id: string;
          quantity: number;
          signed_quantity: number;
        }[];
      })
    | (Omit<Static<typeof createPackagingTransactionExportBody>, "items"> & {
        items: {
          warehouse_id: string;
          packaging_id: string;
          quantity: number;
          signed_quantity: number;
        }[];
      })
    | (Omit<Static<typeof createPackagingTransactionAdjustBody>, "items"> & {
        items: {
          warehouse_id: string;
          packaging_id: string;
          quantity: number;
          signed_quantity: number;
        }[];
      })
    | (Omit<Static<typeof createPackagingTransactionTransferBody>, "items"> & {
        items: {
          warehouse_id: string;
          packaging_id: string;
          quantity: number;
          signed_quantity: number;
        }[];
      });
};
