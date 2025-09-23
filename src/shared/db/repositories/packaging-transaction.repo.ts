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
    } catch (error: unknown) {
      throw new CustomError({
        message: `PackagingTransactionRepo.createNewPackagingTransaction() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }
}
