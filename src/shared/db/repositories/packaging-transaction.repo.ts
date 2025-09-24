import { QueryConfig } from "pg";
import { FastifyInstance } from "fastify";
import { StatusCodes } from "http-status-codes";

import { CustomError } from "@/shared/error-handler";
import { CreateNewPackagingTransactionType } from "@/modules/v1/packaging-transactions/packaging-transaction.schema";

export default class PackagingTransactionRepo {
  constructor(private fastify: FastifyInstance) {}

  async findOrCreatePackagingInventory(
    packaging_id: string,
    warehouse_id: string
  ): Promise<PackagingInventory> {
    const queryConfig: QueryConfig = {
      text: `
        WITH
            ins AS (
                INSERT INTO
                    packaging_inventory (
                        packaging_id,
                        warehouse_id,
                        quantity
                    )
                VALUES
                    (
                        $1,
                        $2,
                        0
                    )
                ON CONFLICT (packaging_id, warehouse_id) DO NOTHING
                RETURNING
                    *
            )
        SELECT
            *
        FROM
            ins
        UNION ALL
        SELECT
            *
        FROM
            packaging_inventory
        WHERE
            packaging_id = $1
            AND warehouse_id = $2
        LIMIT
            1;
      `,
      values: [packaging_id, warehouse_id],
    };

    try {
      const { rows: inventories } =
        await this.fastify.query<PackagingInventory>(queryConfig);
      return inventories[0];
    } catch (error: unknown) {
      throw new CustomError({
        message: `PackagingTransactionRepo.findPackagingTransaction() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async createNewPackagingTransaction(data: CreateNewPackagingTransactionType) {
    const columns = [
      "type",
      "from_warehouse_id",
      "note",
      "transaction_date",
      "status",
    ];
    const packagingTransactionValues = [
      data.type,
      data.from_warehouse_id,
      data.note,
      data.transaction_date,
      data.status,
    ];
    const placeholders = [
      "$1::text",
      "$2::text",
      "$3::text",
      "$4::timestamptz",
      "$5::text",
    ];

    if (data.type == "TRANSFER") {
      columns.push("to_warehouse_id");
      packagingTransactionValues.push(data.to_warehouse_id);
      placeholders.push("$6::text");
    }

    try {
      await this.fastify.transaction(async (client) => {
        // Tạo packagings_transaction
        const { rows: new_packaging_transactions } =
          await client.query<PackagingTransaction>({
            text: `
            INSERT INTO packaging_transactions (${columns.join(", ")}) 
            VALUES (${placeholders.join(", ")})
            RETURNING *;
          `,
            values: packagingTransactionValues,
          });

        const packagingTransactionItemFromValues: any[] = [
          new_packaging_transactions[0].id,
        ];

        const packagingTransactionItemFromPlaceholders: string[] =
          data.items.map((i, idx) => {
            const index = idx * 4;

            packagingTransactionItemFromValues.push(
              i.packaging_id,
              i.warehouse_id,
              i.quantity,
              i.signed_quantity
            );
            return `($1, $${index + 2}, $${index + 3}, $${index + 4}, $${
              index + 5
            })`;
          });

        // tạo danh sách sản phẩm từ kho nguồn
        const { rows: transaction_items } =
          await client.query<PackagingTransactionItem>({
            text: `
            INSERT INTO packaging_transaction_items (packaging_transaction_id, packaging_id, warehouse_id, quantity, signed_quantity) 
            VALUES ${packagingTransactionItemFromPlaceholders.join(", ")}
            RETURNING *;
          `,
            values: packagingTransactionItemFromValues,
          });

        if (data.status == "COMPLETED") {
          await client.query({
            text: `
              UPDATE packaging_inventory pi
              SET
                  quantity = pi.quantity + pti.signed_quantity
              FROM packaging_transaction_items pti
              WHERE pti.packaging_transaction_id = $1
                AND pi.packaging_id = pti.packaging_id
                AND pi.warehouse_id = pti.warehouse_id;
            `,
            values: [new_packaging_transactions[0].id],
          });
        }
      });
    } catch (error: unknown) {
      throw new CustomError({
        message: `PackagingTransactionRepo.createNewPackagingTransaction() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }
}
