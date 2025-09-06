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

  async findByWarehouseId(warehouse_id: string): Promise<PackagingStock[]> {
    const queryConfig: QueryConfig = {
      text: `SELECT * FROM packaging_stocks WHERE warehouse_id = $1;`,
      values: [warehouse_id],
    };
    try {
      const { rows }: QueryResult<PackagingStock> =
        await this.fastify.query<PackagingStock>(queryConfig);
      return rows;
    } catch (error: unknown) {
      throw new CustomError({
        message: `PackagingStockRepo.findByWarehouseId() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async findByPackagingId(packaging_id: string): Promise<PackagingStock[]> {
    const queryConfig: QueryConfig = {
      text: `SELECT * FROM packaging_stocks WHERE packaging_id = $1;`,
      values: [packaging_id],
    };
    try {
      const { rows }: QueryResult<PackagingStock> =
        await this.fastify.query<PackagingStock>(queryConfig);
      return rows;
    } catch (error: unknown) {
      throw new CustomError({
        message: `PackagingStockRepo.findByPackagingId() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }
}
