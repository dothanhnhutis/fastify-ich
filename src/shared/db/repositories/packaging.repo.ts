import { FastifyInstance } from "fastify";
import { QueryConfig, QueryResult } from "pg";

import { BadRequestError } from "@/shared/error-handler";
import {
  CreatePackagingBodyType,
  QueryPackagingsType,
  UpdatePackagingByIdBodyType,
} from "@/modules/v1/packagings/packaging.schema";
import { isDataString } from "@/shared/utils";

export default class PackagingRepo {
  constructor(private fastify: FastifyInstance) {}

  async query(
    query: QueryPackagingsType
  ): Promise<{ packagings: Packaging[]; metadata: Metadata }> {
    let queryString = [
      `
      SELECT
          p.*,
          SUM(ps.quantity)::int AS quantity
      FROM
          packagings p
          LEFT JOIN packaging_stocks ps ON (p.id = ps.packaging_id)
      `,
    ];
    const values: any[] = [];
    let where: string[] = [];
    let idx = 1;

    if (query.name != undefined) {
      where.push(`p.name ILIKE $${idx++}::text`);
      values.push(`%${query.name.trim()}%`);
    }

    if (query.deleted != undefined) {
      where.push(
        query.deleted ? `p.deleted_at IS NOT NULL` : `p.deleted_at IS NULL`
      );
    }

    if (query.created_from) {
      where.push(`p.created_at >= $${idx++}::timestamptz`);
      values.push(
        `${
          isDataString(query.created_from.trim())
            ? `${query.created_from.trim()}T00:00:00.000Z`
            : query.created_from.trim()
        }`
      );
    }

    if (query.created_to) {
      where.push(`p.created_at <= $${idx++}::timestamptz`);
      values.push(
        `${
          isDataString(query.created_to.trim())
            ? `${query.created_to.trim()}T23:59:59.999Z`
            : query.created_to.trim()
        }`
      );
    }

    if (where.length > 0) {
      queryString.push(`WHERE ${where.join(" AND ")}`);
    }

    queryString.push("GROUP BY p.id");

    try {
      return await this.fastify.transaction(async (client) => {
        const { rows } = await client.query<{ count: string }>({
          text: `WITH grouped AS (${queryString.join(
            " "
          )}) SELECT  COUNT(*)::int AS count FROM grouped;`,
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

        const { rows: packagings } = await client.query<Packaging>(queryConfig);

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
      });
    } catch (error: any) {
      throw new BadRequestError(`PackagingRepo.query() method error: ${error}`);
    }
  }

  async findById(id: string): Promise<Packaging | null> {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            p.*,
            SUM(ps.quantity)::int AS quantity
        FROM
            packagings p
            LEFT JOIN packaging_stocks ps ON (p.id = ps.packaging_id)
        WHERE
            id = $1
        GROUP BY
            p.id;
      `,
      values: [id],
    };

    try {
      const { rows }: QueryResult<Packaging> =
        await this.fastify.query<Packaging>(queryConfig);
      return rows[0] ?? null;
    } catch (error: any) {
      throw new BadRequestError(
        `PackagingRepo.findById() method error: ${error}`
      );
    }
  }

  async findPackagingDetailById(id: string) {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            p.*,
            SUM(ps.quantity)::int AS total_quantity,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id',
                        w.id,
                        'name',
                        w.name,
                        'address',
                        w.address,
                        'quantity',
                        ps.quantity,
                        'deleted_at',
                        to_char(
                            w.deleted_at AT TIME ZONE 'UTC',
                            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                        ),
                        'created_at',
                        to_char(
                            w.created_at AT TIME ZONE 'UTC',
                            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                        ),
                        'updated_at',
                        to_char(
                            w.updated_at AT TIME ZONE 'UTC',
                            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                        )
                    )
                ),
                '[]'
            ) as warehouses
        FROM
            packagings p
            LEFT JOIN packaging_stocks ps ON (p.id = ps.packaging_id)
            LEFT JOIN warehouses w ON (w.id = ps.warehouse_id)
        WHERE
            p.id = $1
        GROUP BY
            p.id;
      `,
      values: [id],
    };

    try {
      const { rows }: QueryResult<PackagingDetail> =
        await this.fastify.query<PackagingDetail>(queryConfig);
      return rows[0] ?? null;
    } catch (error: any) {
      throw new BadRequestError(
        `PackagingRepo.findPackagingDetailById() method error: ${error}`
      );
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
      throw new BadRequestError(
        `PackagingRepo.create() method error: ${error}`
      );
    }
  }

  async update(id: string, data: UpdatePackagingByIdBodyType): Promise<void> {
    if (Object.keys(data).length == 0) return;

    try {
      await this.fastify.transaction(async (client) => {
        if (data.warehouseIds) {
          if (data.warehouseIds.length > 0) {
            // delete warehouse
            await client.query({
              text: `DELETE FROM packaging_stocks
            WHERE packaging_id = $1::text 
              AND warehouse_id NOT IN (${data.warehouseIds
                .map((_, i) => {
                  return `$${i + 2}::text`;
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
          } else {
            await client.query({
              text: `DELETE FROM packaging_stocks
            WHERE packaging_id = $1::text RETURNING *;`,
              values: [id],
            });
          }
        }

        let idx = 1;
        const sets: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) {
          sets.push(`"name" = $${idx++}`);
          values.push(data.name);
        }

        if (data.isDelete !== undefined) {
          sets.push(`"deleted_at" = $${idx++}`);
          values.push(data.isDelete ? new Date() : null);
        }
        values.push(id);

        if (sets.length > 0) {
          const queryConfig: QueryConfig = {
            text: `UPDATE packagings SET ${sets.join(
              ", "
            )} WHERE id = $${idx} RETURNING *;`,
            values,
          };
          const { rows: warehouses } = await client.query<Warehouse>(
            queryConfig
          );
        }
      });
    } catch (error: unknown) {
      throw new BadRequestError(
        `PackagingRepo.update() method error: ${error}`
      );
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
      throw new BadRequestError(
        `PackagingRepo.delete() method error: ${error}`
      );
    }
  }
}
