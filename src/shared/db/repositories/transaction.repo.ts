import { FastifyRequest } from "fastify";
import { QueryConfig, QueryResult } from "pg";
import { StatusCodes } from "http-status-codes";

import { CustomError } from "@/shared/error-handler";
import { CreateNoteType } from "@/modules/v1/note/note.schema";

type CreateNoteRepoType = {
  type: "IMPORT" | "EXPORT" | "ADJUST";
  note: string;
  items: {
    packaging_stock_id: string;
    quantity: number;
    signed_quantity: number;
  }[];
  performed_by: string;
};

export default class TransactionRepo {
  constructor(private req: FastifyRequest) {}

  async create(data: CreateNoteRepoType) {
    const queryConfig: QueryConfig = {
      text: `INSERT INTO packaging_transactions (type, note) VALUES ($1::transaction_type, $2::text) RETURNING *;`,
      values: [data.type, data.note],
    };
    try {
      await this.req.pg.query("BEGIN");
      const { rows: transactionRow }: QueryResult<Omit<Transaction, "items">> =
        await this.req.pg.query<Omit<Transaction, "items">>(queryConfig);

      console.log(transactionRow[0]);
      const values: any[] = [];
      const placeholders = data.items
        .map((item, i) => {
          const baseIndex = i * 4;

          values.push(
            item.packaging_stock_id,
            transactionRow[0].id,
            item.quantity,
            item.signed_quantity
          );
          return `($${baseIndex + 1}::text, $${baseIndex + 2}::text, $${
            baseIndex + 3
          }::int, $${baseIndex + 4}::int)`;
        })
        .join(", ");

      const { rows: transactionItemRows } =
        await this.req.pg.query<TransactionItem>({
          text: `INSERT INTO packaging_transaction_items (packaging_stock_id, packaging_transaction_id, quantity, signed_quantity) VALUES ${placeholders} RETURNING *`,
          values,
        });

      const result = { ...transactionRow[0], items: transactionItemRows };

      await this.req.pg.query({
        text: "INSERT INTO packaging_transaction_audits (packaging_transaction_id, action_type, new_data, performed_by) VALUES ($1::text, $2::action_type, $3::json, $4::text);",
        values: [
          transactionRow[0].id,
          "CREATE",
          JSON.stringify(result),
          data.performed_by,
        ],
      });

      await this.req.pg.query("COMMIT");

      return result;
    } catch (error: unknown) {
      await this.req.pg.query("ROLLBACK");
      throw new CustomError({
        message: `TransactionRepo.create() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }
}
