import { CustomError } from "@/shared/error-handler";
import { FastifyInstance, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { QueryConfig, QueryResult } from "pg";

type PackagingStock = {
  id: string;
  warehouse_id: string;
  packaging_id: string;
  quatity: number;
  created_at: Date;
  updated_at: Date;
};

export default class PackagingStockRepo {
  constructor(private fastify: FastifyInstance) {}

  async findById(id: string): Promise<PackagingStock | null> {
    const queryConfig: QueryConfig = {
      text: `SELECT * FROM packaging_stocks WHERE id = $1 LIMIT 1;`,
      values: [id],
    };
    try {
      const { rows }: QueryResult<PackagingStock> =
        await this.fastify.query<PackagingStock>(queryConfig);
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new CustomError({
        message: `PackagingStockRepo.findById() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }
}
