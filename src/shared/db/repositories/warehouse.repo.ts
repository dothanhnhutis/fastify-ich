import { FastifyInstance } from "fastify";
import { QueryConfig, QueryResult } from "pg";

import { BadRequestError, CustomError } from "@/shared/error-handler";
import {
  CreateWarehouseBodyType,
  QueryWarehousesType,
  UpdateWarehouseByIdBodyType,
} from "@/modules/v1/warehouses/warehouse.schema";
import { isDataString } from "@/shared/utils";

export default class WarehouseRepo {
  constructor(private fastify: FastifyInstance) {}

  async query(
    query: QueryWarehousesType
  ): Promise<{ warehouses: Warehouse[]; metadata: Metadata }> {
    let queryString = [
      `
      SELECT
        w.*,
          count(ps.packaging_id) FILTER (
              WHERE
                  p.deleted_at IS NULL
          )::int AS packaging_count
      FROM
        packaging_stocks ps
        LEFT JOIN packagings p ON (ps.packaging_id = p.id)
        LEFT JOIN warehouses w ON (ps.warehouse_id = w.id)
      `,
    ];
    const values: any[] = [];
    let where: string[] = [];
    let idx = 1;

    if (query.name != undefined) {
      where.push(`name ILIKE $${idx++}::text`);
      values.push(`%${query.name.trim()}%`);
    }

    if (query.address != undefined) {
      where.push(`address ILIKE $${idx++}::text`);
      values.push(`%${query.address.trim()}%`);
    }

    if (query.deleted != undefined) {
      where.push(
        query.deleted ? `disabled_at IS NOT NULL` : `disabled_at IS NULL`
      );
    }

    if (query.created_from) {
      where.push(`w.created_at >= $${idx++}::timestamptz`);
      values.push(
        `${
          isDataString(query.created_from.trim())
            ? `${query.created_from.trim()}T00:00:00.000Z`
            : query.created_from.trim()
        }`
      );
    }

    if (query.created_to) {
      where.push(`w.created_at <= $${idx++}::timestamptz`);
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

    queryString.push("GROUP BY w.id");

    try {
      return await this.fastify.transaction(async (client) => {
        const { rows } = await client.query<{ total_groups: string }>({
          text: `WITH grouped AS (${queryString.join(
            " "
          )}) SELECT  COUNT(*)::int AS total_groups FROM grouped;`,
          values,
        });
        const totalItem = parseInt(rows[0].total_groups);

        if (query.sort != undefined) {
          const unqueField = query.sort.reduce<Record<string, string>>(
            (prev, curr) => {
              const [field, direction] = curr.split(".");
              prev[field] = direction.toUpperCase();
              return prev;
            },
            {}
          );

          const orderBy = Object.entries(unqueField)
            .map(([field, direction]) => `${field} ${direction}`)
            .join(", ");

          queryString.push(`ORDER BY ${orderBy}`);
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

        const { rows: warehouses } = await this.fastify.query<Warehouse>(
          queryConfig
        );

        const totalPage = Math.ceil(totalItem / limit);

        return {
          warehouses,
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
      throw new BadRequestError(`WarehouseRepo.query() method error: ${error}`);
    }
  }

  async findById(id: string): Promise<Warehouse | null> {
    const queryConfig: QueryConfig = {
      text: `SELECT
                w.*,
                count(ps.packaging_id) FILTER (
                    WHERE
                        p.deleted_at IS NULL
                )::int AS packaging_count
            FROM
                packaging_stocks ps
                LEFT JOIN packagings p ON (ps.packaging_id = p.id)
                LEFT JOIN warehouses w ON (ps.warehouse_id = w.id)
            WHERE warehouse_id = $1
            GROUP BY
                w.id`,
      values: [id],
    };
    try {
      const { rows }: QueryResult<Warehouse> =
        await this.fastify.query<Warehouse>(queryConfig);
      return rows[0] ?? null;
    } catch (error: any) {
      throw new BadRequestError(
        `WarehouseRepo.findById() method error: ${error}`
      );
    }
  }

  async findWarehouseDetailById(id: string): Promise<WarehouseDetail | null> {
    const queryConfig: QueryConfig = {
      text: `SELECT
                w.*,
                count(ps.packaging_id) FILTER (
                    WHERE
                        p.deleted_at IS NULL
                )::int AS packaging_count,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id',
                            p.id,
                            'name',
                            p.name,
                            'deleted_at',
                            to_char(
                                p.created_at AT TIME ZONE 'UTC',
                                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                            ),
                            'created_at',
                            to_char(
                                p.created_at AT TIME ZONE 'UTC',
                                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                            ),
                            'updated_at',
                            to_char(
                                p.updated_at AT TIME ZONE 'UTC',
                                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                            ),
                            'quantity',
                            ps.quantity
                        )
                    ) FILTER (
                        WHERE
                            p.deleted_at IS NULL
                    ),
                    '[]'
                ) AS packagings
            FROM
                packaging_stocks ps
                LEFT JOIN packagings p ON (ps.packaging_id = p.id)
                LEFT JOIN warehouses w ON (ps.warehouse_id = w.id)
            WHERE
                warehouse_id = $1
            GROUP BY
                w.id
            LIMIT 1;`,
      values: [id],
    };
    try {
      const { rows }: QueryResult<WarehouseDetail> =
        await this.fastify.query<WarehouseDetail>(queryConfig);
      return rows[0] ?? null;
    } catch (error: any) {
      throw new BadRequestError(
        `WarehouseRepo.findWarehouseDetailById() method error: ${error}`
      );
    }
  }

  async create(data: CreateWarehouseBodyType): Promise<Warehouse> {
    const queryConfig: QueryConfig = {
      text: `INSERT INTO warehouses (name, address) VALUES ($1::text, $2::text) RETURNING *;`,
      values: [data.name, data.address],
    };
    try {
      const newWarehouse = await this.fastify.transaction(async (client) => {
        const { rows: warehouses }: QueryResult<Warehouse> =
          await client.query<Warehouse>(queryConfig);

        if (data.packagingIds && data.packagingIds.length > 0) {
          const values: string[] = [];
          const placeholders = data.packagingIds
            .map((id, i) => {
              const baseIndex = i * 2;
              values.push(warehouses[0].id, id);
              return `($${baseIndex + 1}, $${baseIndex + 2})`;
            })
            .join(", ");

          await client.query({
            text: `INSERT INTO packaging_stocks (warehouse_id, packaging_id) VALUES ${placeholders};`,
            values,
          });
        }

        return warehouses[0];
      });

      return newWarehouse;
    } catch (error: unknown) {
      throw new BadRequestError(
        `WarehouseRepo.create() method error: ${error}`
      );
    }
  }

  async update(id: string, data: UpdateWarehouseByIdBodyType): Promise<void> {
    if (Object.keys(data).length == 0) return;

    try {
      await this.fastify.transaction(async (client) => {
        if (data.packagingIds) {
          if (data.packagingIds.length > 0) {
            // delete warehouse
            await client.query({
              text: `DELETE FROM packaging_stocks
            WHERE warehouse_id = $1::text 
              AND packaging_id NOT IN (${data.packagingIds
                .map((_, i) => {
                  return `$${i + 2}::text`;
                })
                .join(", ")})
            RETURNING *;`,
              values: [id, ...data.packagingIds],
            });
            // insert warehouse
            await client.query({
              text: `INSERT INTO packaging_stocks (packaging_id, warehouse_id)
          VALUES ${data.packagingIds
            .map((_, i) => `($1, $${i + 2})`)
            .join(", ")} 
          ON CONFLICT DO NOTHING;`,
              values: [id, ...data.packagingIds],
            });
          } else {
            await client.query({
              text: `DELETE FROM packaging_stocks
            WHERE warehouse_id = $1::text RETURNING *;`,
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

        if (data.address !== undefined) {
          sets.push(`"address" = $${idx++}`);
          values.push(data.address);
        }

        if (data.isDelete !== undefined) {
          sets.push(`"deleted_at" = $${idx++}`);
          values.push(data.isDelete ? new Date() : null);
        }
        values.push(id);

        if (sets.length > 0) {
          const queryConfig: QueryConfig = {
            text: `UPDATE warehouses SET ${sets.join(
              ", "
            )} WHERE id = $${idx} RETURNING *;`,
            values,
          };
          const { rows: warehouses } = await client.query<Warehouse>(
            queryConfig
          );
        }
      });
    } catch (error) {
      throw new BadRequestError(
        `WarehouseRepo.update() method error: ${error}`
      );
    }
  }

  async delete(id: string): Promise<Warehouse> {
    const queryConfig: QueryConfig = {
      text: `DELETE FROM warehouses WHERE id = $1 RETURNING *;`,
      values: [id],
    };
    try {
      const { rows }: QueryResult<Warehouse> =
        await this.fastify.query<Warehouse>(queryConfig);
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new BadRequestError(
        `WarehouseRepo.delete() method error: ${error}`
      );
    }
  }
}
