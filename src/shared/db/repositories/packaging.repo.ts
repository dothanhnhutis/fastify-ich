import { FastifyInstance, FastifyRequest } from "fastify";
import { QueryConfig, QueryResult } from "pg";
import { StatusCodes } from "http-status-codes";

import { BadRequestError, CustomError } from "@/shared/error-handler";
import {
  CreatePackagingBodyType,
  QueryPackagingsType,
  UpdatePackagingByIdBodyType,
} from "@/modules/v1/packagings/packaging.schema";

export default class PackagingRepo {
  constructor(private fastify: FastifyInstance) {}

  async query(query: QueryPackagingsType): Promise<{ packagings: Packaging[]; metadata: Metadata }>  {
    let queryString = ["SELECT * FROM packagings"];
    const values: any[] = [];
    let where: string[] = [];
    let idx = 1;

    try {
      if (query.name != undefined) {
        where.push(`name ILIKE $${idx++}::text`);
        values.push(`%${query.name.trim()}%`);
      }


      if (query.deleted != undefined) {
        where.push(
          query.deleted ? `disabled_at IS NOT NULL` : `disabled_at IS NULL`
        );
      }

      if (where.length > 0) {
        queryString.push(`WHERE ${where.join(" AND ")}`);
      }

      const { rows } = await this.fastify.query<{ count: string }>({
        text: queryString.join(" ").replace("*", "count(*)"),
        values,
      });
      const totalItem = parseInt(rows[0].count);

      if (query.sort != undefined) {
        queryString.push(
          `ORDER BY ${query.sort
            .map((sort) => {
              const [field, direction] = sort.split(".");
              return `${field} ${direction.toUpperCase()}`;
            })
            .join(", ")}`
        );
      }

      let limit = query.limit ?? totalItem;
      let page = query.page ?? 1;
      let offset = (page - 1) * limit;

      queryString.push(`LIMIT $${idx++}::int OFFSET $${idx}::int`);
      values.push(limit, offset);

      const queryConfig: QueryConfig = {
        text: queryString.join(" "),
        values,
      };

      const { rows: packagings } = await this.fastify.query<Warehouse>(
        queryConfig
      );

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
    } catch (error: any) {
      throw new BadRequestError(`PackagingRepo.query() method error: ${error}`);
    }
  }
  
  async findById(id: string): Promise<Packaging | null> {
    const queryConfig: QueryConfig = {
      text: `
      SELECT p.*,
            sum(ps.quantity)::int,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id',
                        ps.id,
                        'warehouse_id',
                        ps.warehouse_id,
                        'packaging_id',
                        ps.packaging_id,
                        'quantity',
                        ps.quantity,
                        'warehouse',
                        row_to_json(w),
                        'created_at',
                        ps.created_at,
                        'updated_at',
                        ps.updated_at
                    )
                ) FILTER (
                    WHERE ps.warehouse_id IS NOT NULL
                ),
                '[]'
            ) AS items
      FROM packagings p
          LEFT JOIN packaging_stocks ps ON p.id = ps.packaging_id
          LEFT JOIN warehouses w ON ps.warehouse_id = w.id
      WHERE p.id = $1
      GROUP BY p.id
      LIMIT 1;
      `,
      values: [id],
    };
    try {
      const { rows }: QueryResult<Packaging> =
        await this.fastify.query<Packaging>(queryConfig);
      return rows[0] ?? null;
    } catch (error: any) {
      throw new CustomError({
        message: `PackagingRepo.findById() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async create(data: CreatePackagingBodyType) {
    const queryConfig: QueryConfig = {
      text: `INSERT INTO packagings (name) VALUES ($1::text) RETURNING *;`,
      values: [data.name],
    };
    try {
      return await this.fastify.transaction(async (client) => {
        const { rows: packagings } = await client.query<Packaging>(queryConfig);

        if (data.warehouseIds && data.warehouseIds.length > 0) {
          await client.query({
            text: `INSERT INTO packaging_stocks (packaging_id, warehouse_id ) VALUES ${data.warehouseIds
              .map((_, i) => {
                return `($1, $${i + 2})`;
              })
              .join(", ")}`,
            values: [packagings[0].id, ...data.warehouseIds],
          });
        }
        return packagings[0];
      });
    } catch (error: unknown) {
      throw new CustomError({
        message: `PackagingRepo.create() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async update(id: string, data: UpdatePackagingByIdBodyType): Promise<void> {
 
    if (Object.keys(data).length == 0) return;
    
    try {
      await this.fastify.transaction(async (client) => {
        if (data.name) {
          await client.query({
            text: `UPDATE packagings SET name = $1::text WHERE id = $2::text RETURNING *;`,
            values: [data.name, id],
          });
        }

        if (data.warehouseIds) {
          // delete warehouse
          await client.query({
            text: `DELETE packaging_stocks
          WHERE packaging_id = $1::text 
            AND warehouse_id NOT IN (${data.warehouseIds
              .map((_, i) => {
                return `$${i + 2}`;
              })
              .join(", ")}) 
          RETURNING *;`,
            values: [id, ...data.warehouseIds],
          });
          // insert warehouse
          await client.query({
            text: `INSERT INTO packaging_stocks (packaging_id, warehouse_id)
          VALUES ${data.warehouseIds
            .map((_, i) => `($1, $${i + 2})`)
            .join(", ")} 
          ON CONFLICT DO NOTHING;`,
            values: [id, ...data.warehouseIds],
          });
        }
      });
    } catch (error: unknown) {
      throw new CustomError({
        message: `PackagingRepo.update() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async delete(id: string): Promise<Packaging> {
    const queryConfig: QueryConfig = {
      text: `DELETE FROM packagings WHERE id = $1 RETURNING *;`,
      values: [id],
    };
    try {
      const { rows }: QueryResult<Packaging> =
        await this.fastify.query<Packaging>(queryConfig);
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new CustomError({
        message: `PackagingRepo.delete() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }
}
