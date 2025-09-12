import { FastifyInstance } from "fastify";
import { QueryConfig, QueryResult } from "pg";

import { BadRequestError } from "@/shared/error-handler";
import {
  CreatePackagingBodyType,
  GetWarehousesByPackagingIdQueryType,
  QueryPackagingsType,
  UpdatePackagingByIdBodyType,
} from "@/modules/v1/packagings/packaging.schema";
import { isDataString } from "@/shared/utils";

export default class PackagingRepo {
  constructor(private fastify: FastifyInstance) {}

  async findPackagings(query: QueryPackagingsType): Promise<QueryPackagings> {
    let queryString = [
      `
      SELECT
          p.*,
          COUNT(pi.warehouse_id) FILTER (
              WHERE
                  pi.warehouse_id IS NOT NULL
          )::int as warehouse_count,
          SUM(pi.quantity) FILTER (
              WHERE
                  pi.warehouse_id IS NOT NULL
          )::int as total_quantity
      FROM
          packagings p
          LEFT JOIN packaging_inventory pi ON (pi.packaging_id = p.id)
          LEFT JOIN warehouses w ON (pi.warehouse_id = w.id)
      `,
    ];
    const values: any[] = [];
    let where: string[] = [];
    let idx = 1;

    if (query.name != undefined) {
      where.push(`p.name ILIKE $${idx++}::text`);
      values.push(`%${query.name.trim()}%`);
    }

    if (query.unit != undefined) {
      where.push(`p.unit = $${idx++}::text`);
      values.push(query.unit);
    }

    if (query.status != undefined) {
      where.push(
        `status = $${idx++}::text`,
        query.status == "ACTIVE"
          ? "deactived_at IS NULL"
          : "deactived_at IS NOT NULL"
      );
      values.push(query.status);
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

        const { rows: packagings } = await client.query<Packaging>(queryConfig);

        const totalPage = Math.ceil(totalItem / limit) || 0;

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

  async findPackagingById(packagingId: string): Promise<Packaging | null> {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            p.*,
            COUNT(pi.warehouse_id) FILTER (
                WHERE
                    pi.warehouse_id IS NOT NULL
            )::int as warehouse_count,
            SUM(pi.quantity) FILTER (
                WHERE
                    pi.warehouse_id IS NOT NULL
            )::int as total_quantity
        FROM
            packagings p
            LEFT JOIN packaging_inventory pi ON (pi.packaging_id = p.id)
            LEFT JOIN warehouses w ON (pi.warehouse_id = w.id)
        WHERE
            p.id = $1
        GROUP BY
            p.id;
      `,
      values: [packagingId],
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

  async findWarehousesByPackagingId(
    packagingId: string,
    query?: GetWarehousesByPackagingIdQueryType
  ): Promise<QueryWarehousesByPackagingId> {
    const newTable = `
      WITH 
        warehouses AS (
          SELECT
              w.*,
              pi.quantity
          FROM
              packaging_inventory pi
              LEFT JOIN warehouses w ON (pi.warehouse_id = w.id)
          WHERE
              pi.packaging_id = $1
              AND w.status = 'ACTIVE'
              AND w.deactived_at IS NULL
        )
    `;

    const queryString = [`SELECT * FROM warehouses`];

    const values: any[] = [packagingId];
    let where: string[] = [];
    let idx = 2;

    if (query) {
      if (query.name != undefined) {
        where.push(`name ILIKE $${idx++}::text`);
        values.push(`%${query.name.trim()}%`);
      }

      if (query.address != undefined) {
        where.push(`address ILIKE $${idx++}::text`);
        values.push(`%${query.address.trim()}%`);
      }

      if (query.status != undefined) {
        where.push(
          `status = $${idx++}::text`,
          query.status == "ACTIVE"
            ? "deactived_at IS NULL"
            : "deactived_at IS NOT NULL"
        );
        values.push(query.status);
      }

      if (query.created_from) {
        where.push(`created_at >= $${idx++}::timestamptz`);
        values.push(
          `${
            isDataString(query.created_from.trim())
              ? `${query.created_from.trim()}T00:00:00.000Z`
              : query.created_from.trim()
          }`
        );
      }

      if (query.created_to) {
        where.push(`created_at <= $${idx++}::timestamptz`);
        values.push(
          `${
            isDataString(query.created_to.trim())
              ? `${query.created_to.trim()}T23:59:59.999Z`
              : query.created_to.trim()
          }`
        );
      }
    }

    if (where.length > 0) {
      queryString.push(`WHERE ${where.join(" AND ")}`);
    }

    try {
      return await this.fastify.transaction(async (client) => {
        const { rows } = await client.query<{ count: string }>({
          text: [newTable, queryString.join(" ").replace("*", "count(*)")].join(
            " "
          ),
          values,
        });
        const totalItem = parseInt(rows[0].count);

        if (query?.sort != undefined) {
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

        let limit = query?.limit ?? totalItem;
        let page = query?.page ?? 1;
        let offset = (page - 1) * limit;

        queryString.push(`LIMIT $${idx++}::int OFFSET $${idx}::int`);
        values.push(limit, offset);

        const queryConfig: QueryConfig = {
          text: [newTable, queryString.join(" ")].join(" "),
          values,
        };

        const { rows: warehouses } = await this.fastify.query<Warehouse>(
          queryConfig
        );

        const totalPage = Math.ceil(totalItem / limit) || 0;

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
      throw new BadRequestError(
        `PackagingRepo.findById() method error: ${error}`
      );
    }
  }

  async findPackagingDetailById(id: string): Promise<PackagingDetail | null> {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            p.*,
            COUNT(pi.warehouse_id) FILTER (
                WHERE
                    pi.warehouse_id IS NOT NULL
                    AND w.status = 'ACTIVE'
            )::int as warehouse_count,
            SUM(pi.quantity) FILTER (
                WHERE
                    pi.warehouse_id IS NOT NULL
                    AND w.status = 'ACTIVE'
            )::int as total_quantity,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id',
                        w.id,
                        'name',
                        w.name,
                        'address',
                        w.address,
                        'status',
                        w.status,
                        'deactived_at',
                        w.deactived_at,
                        'created_at',
                        w.created_at,
                        'updated_at',
                        w.updated_at,
                        'quantity',
                        pi.quantity
                    )
                ) FILTER (
                    WHERE
                        w.id IS NOT NULL
                        AND w.status = 'ACTIVE'
                ),
                '[]'
            ) AS warehouses
        FROM
            packagings p
            LEFT JOIN packaging_inventory pi ON (pi.packaging_id = p.id)
            LEFT JOIN warehouses w ON (pi.warehouse_id = w.id)
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
  //
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
  //
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
  //
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
