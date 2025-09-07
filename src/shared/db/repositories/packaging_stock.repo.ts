import { QueryPackagingsType } from "@/modules/v1/packagings/packaging.schema";
import { CustomError } from "@/shared/error-handler";
import { FastifyInstance, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { QueryConfig, QueryResult } from "pg";

type PackagingStock = {
  id: string;
  name: string;
  quatity: number;
  deleted_at: Date;
  created_at: Date;
  updated_at: Date;
};

type WarehouseStock = {};

export default class PackagingStockRepo {
  constructor(private fastify: FastifyInstance) {}

  async findByWarehouseId(
    warehouse_id: string,
    query?: QueryPackagingsType
  ): Promise<{ packagings: PackagingStock[]; metadata: Metadata }> {
    const newTable = `WITH packaging_stocks AS (SELECT
                p.*,
                ps.quantity
            FROM
                packaging_stocks ps
                LEFT JOIN packagings p ON (ps.packaging_id = p.id)
            WHERE
                ps.warehouse_id = $1::text)`;

    const queryString = [`SELECT * FROM packaging_stocks`];

    const values: any[] = [warehouse_id];
    let where: string[] = [];
    let idx = 2;

    if (query) {
      if (query.name != undefined) {
        where.push(`name ILIKE $${idx++}::text`);
        values.push(`%${query.name.trim()}%`);
      }

      if (query.deleted != undefined) {
        where.push(
          query.deleted ? `deleted_at IS NOT NULL` : `disabled_at IS NULL`
        );
      }
    }

    if (where.length > 0) {
      queryString.push(`WHERE ${where.join(" AND ")}`);
    }

    try {
      const { rows } = await this.fastify.query<{ count: string }>({
        text: [newTable, queryString.join(" ").replace("*", "count(*)")].join(
          " "
        ),
        values,
      });

      const totalItem = parseInt(rows[0].count);

      if (query && query.sort != undefined) {
        queryString.push(
          `ORDER BY ${query.sort
            .map((sort) => {
              const [field, direction] = sort.split(".");
              return `${field} ${direction.toUpperCase()}`;
            })
            .join(", ")}`
        );
      }

      let limit = query?.limit ?? totalItem;
      let page = query?.page ?? 1;
      let offset = (page - 1) * limit;

      queryString.push(`LIMIT $${idx++}::int OFFSET $${idx}::int`);
      values.push(limit, offset);

      console.log([newTable, queryString.join(" ")].join(" "));

      const queryConfig: QueryConfig = {
        text: [newTable, queryString.join(" ")].join(" "),
        values,
      };

      const { rows: packagings }: QueryResult<PackagingStock> =
        await this.fastify.query<PackagingStock>(queryConfig);

      const totalPage = Math.ceil(totalItem / limit);

      return {
        packagings,
        metadata: {
          totalItem,
          totalPage,
          hasNextPage: page < totalPage,
          limit: totalItem > 0 ? limit : 0,
          itemStart: totalItem > 0 ? (page - 1) * limit + 1 : 0,
          itemEnd: Math.min(page * limit, totalItem),
        },
      };
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
