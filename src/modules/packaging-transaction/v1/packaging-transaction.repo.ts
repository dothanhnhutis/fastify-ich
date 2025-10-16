import { BadRequestError, CustomError } from "@shared/utils/error-handler";
import type { FastifyInstance } from "fastify";
import { StatusCodes } from "http-status-codes";
import type { QueryConfig, QueryResult } from "pg";
import type {
  IPackagingTransactionRepository,
  PackagingInventory,
  PackagingTransaction,
  PackagingTransactionDBType,
  PackagingTransactionItem,
} from "./packaging-transaction.types";

export default class PackagingTransactionRepository
  implements IPackagingTransactionRepository
{
  constructor(private fastify: FastifyInstance) {}

  async findById(id: string) {
    const queryConfig: QueryConfig = {
      text: `
            SELECT
              pt.*,
              CASE 
                WHEN fw.id IS NOT NULL THEN 
                  COALESCE(
                    json_build_object(
                      'id', fw.id,
                      'name', fw.name,
                      'address', fw.address
                    )
                  )
                ELSE NULL
                END
                AS from_warehouse,
              CASE 
                WHEN tw.id IS NOT NULL THEN 
                  COALESCE(
                    json_build_object(
                      'id', tw.id,
                      'name', tw.name,
                      'address', tw.address
                    )
                  )
                ELSE NULL
                END
                AS to_warehouse,
              COUNT(pti.packaging_id) as item_count
            FROM packaging_transactions pt
              LEFT JOIN warehouses fw ON pt.from_warehouse_id = fw.id
              LEFT JOIN warehouses tw ON pt.to_warehouse_id = tw.id
              LEFT JOIN packaging_transaction_items pti ON pti.packaging_transaction_id = pt.id
            WHERE 
              pt.id = $1
            GROUP BY 
              pt.id,
              fw.id,
              fw.name,
              fw.address,
              tw.id,
              tw.name,
              tw.address,
              pti.packaging_id;
          `,
      values: [id],
    };

    try {
      const { rows } = await this.fastify.query<PackagingTransaction>(
        queryConfig
      );
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new BadRequestError(
        `PackagingTransactionRepo.findById() method error: ${error}`
      );
    }
  }

  async findDetailById(id: string) {
    const queryConfig: QueryConfig = {
      text: `
          SELECT
              pt.*,
              CASE 
                  WHEN fw.id IS NOT NULL THEN 
                      json_build_object('id', fw.id, 'name', fw.name, 'address', fw.address)
                  ELSE NULL
              END AS from_warehouse,
              CASE 
                  WHEN tw.id IS NOT NULL THEN 
                      json_build_object('id', tw.id, 'name', tw.name, 'address', tw.address)
                  ELSE NULL
              END AS to_warehouse,
              COALESCE(
                  json_agg(item_json),
                  '[]'
              ) AS items
          FROM packaging_transactions pt
          LEFT JOIN warehouses fw ON pt.from_warehouse_id = fw.id
          LEFT JOIN warehouses tw ON pt.to_warehouse_id = tw.id
          LEFT JOIN LATERAL (
              SELECT
                  json_build_object(
                      'packaging_id', pti.packaging_id,
                      'name', pk.name,
                      'quantity', pti.quantity,
                      'from_warehouse', json_build_object(
                          'id', fw.id,
                          'name', fw.name,
                          'address', fw.address,
                          'quantity', MAX(pti.signed_quantity) FILTER (WHERE pti.warehouse_id = fw.id)
                      ),
                      'to_warehouse', CASE 
                          WHEN tw.id IS NOT NULL THEN
                              json_build_object(
                                  'id', tw.id,
                                  'name', tw.name,
                                  'address', tw.address,
                                  'quantity', MAX(pti.signed_quantity) FILTER (WHERE pti.warehouse_id = tw.id)
                              )
                          ELSE NULL
                      END,
                      'created_at', MAX(pti.created_at),
                      'updated_at', MAX(pti.updated_at)
                  ) AS item_json
              FROM packaging_transaction_items pti
              LEFT JOIN packagings pk ON pk.id = pti.packaging_id
              WHERE pti.packaging_transaction_id = pt.id
              GROUP BY pti.packaging_id, pk.name, pti.quantity
          ) item_sub ON TRUE
          WHERE pt.id = $1
          GROUP BY pt.id, fw.id, fw.name, fw.address, tw.id, tw.name, tw.address;
          `,
      values: [id],
    };

    try {
      const { rows }: QueryResult<PackagingTransaction> =
        await this.fastify.query<PackagingTransaction>(queryConfig);
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new BadRequestError(
        `PackagingTransactionRepo.findDetailById() method error: ${error}`
      );
    }
  }

  async findItemsById(id: string, _?: string) {
    const queryConfig: QueryConfig = {
      text: `
      SELECT
        pti.packaging_id,
        pk.name,
        pti.quantity,
        json_build_object(
          'id', fw.id,
          'name', fw.name,
          'address', fw.address,
          'quantity', MAX(pti.signed_quantity) FILTER (WHERE warehouse_id = fw.id)
        ) AS from_warehouse,
        CASE 
          WHEN tw.id IS NOT NULL 
          THEN
            json_build_object(
              'id', tw.id,
              'name', tw.name,
              'address', tw.address,
              'quantity', MAX(pti.signed_quantity) FILTER (WHERE warehouse_id = tw.id)
            )
          ELSE null
          END
          AS to_warehouse,
        pti.created_at,
        pti.updated_at
      FROM 
        packaging_transaction_items pti
        LEFT JOIN packagings pk on pk.id = pti.packaging_id
        LEFT JOIN packaging_transactions pt on pti.packaging_transaction_id = pt.id
        LEFT JOIN warehouses fw on pt.from_warehouse_id = fw.id
        LEFT JOIN warehouses tw on pt.to_warehouse_id = tw.id
      WHERE
        pti.packaging_transaction_id = $1
      GROUP BY
        pti.packaging_transaction_id,
        pti.packaging_id,
        pti.quantity,
        pti.created_at,
        pti.updated_at,
        pt.type,
        pt.from_warehouse_id,
        pt.to_warehouse_id,
        pk.name,
        fw.id,
        fw.name,
        fw.address,
        tw.id,
        tw.name,
        tw.address;
          `,
      values: [id],
    };

    try {
      const { rows }: QueryResult<PackagingTransaction> =
        await this.fastify.query<PackagingTransaction>(queryConfig);
      return rows;
    } catch (error: unknown) {
      throw new BadRequestError(
        `PackagingTransactionRepo.findItemsById() method error: ${error}`
      );
    }
  }

  async findOrCreatePackagingInventory(
    packaging_id: string,
    warehouse_id: string
  ) {
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

  async create(data: PackagingTransactionDBType["create"]) {
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

    if (data.type === "TRANSFER") {
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

        const packagingTransactionItemFromValues: (string | number)[] = [
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
        await client.query<PackagingTransactionItem>({
          text: `
            INSERT INTO packaging_transaction_items (packaging_transaction_id, packaging_id, warehouse_id, quantity, signed_quantity) 
            VALUES ${packagingTransactionItemFromPlaceholders.join(", ")}
            RETURNING *;
          `,
          values: packagingTransactionItemFromValues,
        });

        if (data.status === "COMPLETED") {
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

  // async updateById(id: string, data: any) {}
}
