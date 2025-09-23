import { QueryConfig } from "pg";
import { FastifyInstance } from "fastify";
import { StatusCodes } from "http-status-codes";

import { CustomError } from "@/shared/error-handler";
import { CreateNewPackagingTransactionBodyType } from "@/modules/v1/packaging-transactions/packaging-transaction.schema";

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

  async createNewPackagingTransaction(
    data: CreateNewPackagingTransactionBodyType
  ) {
    const queryConfig: QueryConfig = {
      text: ``,
      values: [],
    };
    try {
      await this.fastify.transaction(async (client) => {
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
          "$4:timestampz",
        ];

        if (data.type == "TRANSFER") {
          columns.push("to_warehouse_id");
          values.push(data.to_warehouse_id);
          placeholders.push("$5:text");
        }

        const { rows: new_packaging_transactions } =
          await client.query<PackagingTransaction>({
            text: `
            INSERT INTO packaging_transactions (${columns.join(", ")}) 
            VALUES (${placeholders.join(", ")})
            RETURNING *;
          `,
            values: packagingTransactionValues,
          });

        const packagingTransactionItemValues: any[] = [
          new_packaging_transactions[0].id,
        ];

        data.items.map((i, idx) => {
          const index = idx * 3;
          const signed_quantity =
            data.type == "IMPORT" || data.type == "ADJUST"
              ? i.quantity
              : -i.quantity;

          packagingTransactionItemValues.push(
            i.packaging_id,
            data.from_warehouse_id,
            i.quantity,
            signed_quantity
          );
          return `($1, $${index + 2}, $${index + 3}, $${index + 4})`;
        });

        await client.query({
          text: `
            INSERT INTO packaging_transaction_items (packaging_transaction_items, packaging_id, warehouse_id, quantity, signed_quantity) 
            VALUES (${placeholders.join(", ")})
            RETURNING *;
          `,
          values: packagingTransactionItemValues,
        });
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
