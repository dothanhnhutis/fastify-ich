import { BadRequestError } from "@shared/utils/error-handler";
import type { FastifyInstance } from "fastify";
import type { QueryConfig } from "pg";
import type { WarehouseRequestType } from "./warehouse.schema";
import type {
  IWarehouseRepository,
  Warehouse,
  WarehouseDetail,
} from "./warehouse.types";

export class WarehouseRepository implements IWarehouseRepository {
  constructor(private fastify: FastifyInstance) {}

  async findWarehouses(
    query: WarehouseRequestType["Query"]["Querystring"]
  ): Promise<{ warehouses: Warehouse[]; metadata: Metadata }> {
    const queryString = [
      `
      SELECT
          w.*,
          COUNT(pi.packaging_id) FILTER (
              WHERE
                  pi.packaging_id IS NOT NULL
                  AND p.status = 'ACTIVE'
          )::int AS packaging_count
      FROM
          warehouses w
          LEFT JOIN packaging_inventory pi ON (pi.warehouse_id = w.id)
          LEFT JOIN packagings p ON (pi.packaging_id = p.id)
      `,
    ];
    const values: (string | number)[] = [];
    const where: string[] = [];
    let idx = 1;

    if (query.name !== undefined) {
      where.push(`w.name ILIKE $${idx++}::text`);
      values.push(`%${query.name.trim()}%`);
    }

    if (query.address !== undefined) {
      where.push(`w.address ILIKE $${idx++}::text`);
      values.push(`%${query.address.trim()}%`);
    }

    if (query.deleted !== undefined) {
      where.push(
        query.deleted ? `disabled_at IS NOT NULL` : `disabled_at IS NULL`
      );
    }

    if (query.created_from) {
      where.push(`w.created_at >= $${idx++}::timestamptz`);
      values.push(query.created_from);
    }

    if (query.created_to) {
      where.push(`w.created_at <= $${idx++}::timestamptz`);
      values.push(query.created_to);
    }

    if (where.length > 0) {
      queryString.push(`WHERE ${where.join(" AND ")}`);
    }

    queryString.push("GROUP BY w.id");

    try {
      return await this.fastify.transaction(async (client) => {
        const { rows } = await client.query<{ count: string }>({
          text: `WITH warehouses AS (${queryString.join(
            " "
          )}) SELECT  COUNT(*)::int AS count FROM warehouses;`,
          values,
        });
        const totalItem = parseInt(rows[0].count, 10);

        if (query.sort !== undefined) {
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

        const limit = query.limit ?? totalItem;
        const page = query.page ?? 1;
        const offset = (page - 1) * limit;

        queryString.push(`LIMIT $${idx++}::int OFFSET $${idx}::int`);
        values.push(limit, offset);

        const queryConfig: QueryConfig = {
          text: queryString.join(" "),
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
    } catch (error: unknown) {
      throw new BadRequestError(`WarehouseRepo.query() method error: ${error}`);
    }
  }

  async findWarehouseById(warehouseId: string): Promise<Warehouse | null> {
    const queryConfig: QueryConfig = {
      text: `SELECT
                w.*,
                COUNT(pi.packaging_id) FILTER (
                    WHERE
                        pi.packaging_id IS NOT NULL
                        AND p.status = 'ACTIVE'
                )::int AS packaging_count
            FROM
                warehouses w
                LEFT JOIN packaging_inventory pi ON (pi.warehouse_id = w.id)
                LEFT JOIN packagings p ON (pi.packaging_id = p.id)
            WHERE
                w.id = $1
            GROUP BY
                w.id;`,
      values: [warehouseId],
    };
    try {
      const { rows } = await this.fastify.query<Warehouse>(queryConfig);
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new BadRequestError(
        `WarehouseRepo.findById() method error: ${error}`
      );
    }
  }

  async findPackagingsByWarehouseId(
    warehouseId: string,
    query?: WarehouseRequestType["GetPackagingsById"]["Querystring"]
  ) {
    const newTable = `
       WITH 
        packagings AS (
          SELECT
              p.*,
              pi.quantity
          FROM
              packaging_inventory pi
              LEFT JOIN packagings p ON (pi.packaging_id = p.id)
          WHERE
              pi.warehouse_id = $1
              AND p.status = 'ACTIVE'
              AND p.deactived_at IS NULL
        )
    `;
    const queryString = [`SELECT * FROM packagings`];
    const values: (string | number)[] = [warehouseId];
    const where: string[] = [];
    let idx = 2;

    if (query) {
      if (query.name !== undefined) {
        where.push(`name ILIKE $${idx++}::text`);
        values.push(`%${query.name.trim()}%`);
      }

      if (query.unit !== undefined) {
        where.push(`unit = $${idx++}::text`);
        values.push(query.unit);
      }

      if (query.status !== undefined) {
        where.push(
          `status = $${idx++}::text`,
          query.status === "ACTIVE"
            ? "deactived_at IS NULL"
            : "deactived_at IS NOT NULL"
        );
        values.push(query.status);
      }

      if (query.created_from) {
        where.push(`created_at >= $${idx++}::timestamptz`);
        values.push(query.created_from);
      }

      if (query.created_to) {
        where.push(`created_at <= $${idx++}::timestamptz`);
        values.push(query.created_to);
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
        const totalItem = parseInt(rows[0].count, 10);

        if (query?.sort !== undefined) {
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

        const limit = query?.limit ?? totalItem;
        const page = query?.page ?? 1;
        const offset = (page - 1) * limit;

        queryString.push(`LIMIT $${idx++}::int OFFSET $${idx}::int`);
        values.push(limit, offset);

        const queryConfig: QueryConfig = {
          text: [newTable, queryString.join(" ")].join(" "),
          values,
        };

        const { rows: packagings } = await this.fastify.query<
          WarehouseDetail["packagings"][number]
        >(queryConfig);

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
    } catch (error: unknown) {
      throw new BadRequestError(
        `PackagingRepo.findPackagingsByWarehouseId() method error: ${error}`
      );
    }
  }

  async findWarehouseDetailById(
    warehouseId: string
  ): Promise<WarehouseDetail | null> {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            w.*,
            COUNT(pi.packaging_id) FILTER (
                WHERE
                    pi.packaging_id IS NOT NULL
                    AND p.status = 'ACTIVE'
            )::int AS packaging_count,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id',
                        p.id,
                        'name',
                        p.name,
                        'min_stock_level',
                        p.min_stock_level,
                        'unit',
                        p.unit,
                        'pcs_ctn',
                        p.pcs_ctn,
                        'status',
                        p.status,
                        'deactived_at',
                        p.deactived_at,
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
                        pi.quantity
                    )
                ) FILTER (
                    WHERE
                        p.id IS NOT NULL
                        AND p.status = 'ACTIVE'
                ),
                '[]'
            ) AS packagings
        FROM
            warehouses w
            LEFT JOIN packaging_inventory pi ON (pi.warehouse_id = w.id)
            LEFT JOIN packagings p ON (pi.packaging_id = p.id)
        WHERE
            w.id = $1
        GROUP BY
            w.id;
    `,
      values: [warehouseId],
    };
    try {
      const { rows } = await this.fastify.query<WarehouseDetail>(queryConfig);
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new BadRequestError(
        `WarehouseRepo.findWarehouseDetailById() method error: ${error}`
      );
    }
  }

  async createNewWarehouse(
    data: WarehouseRequestType["Create"]["Body"]
  ): Promise<Warehouse> {
    const queryConfig: QueryConfig = {
      text: `INSERT INTO warehouses (name, address) VALUES ($1::text, $2::text) RETURNING *;`,
      values: [data.name, data.address],
    };
    try {
      const newWarehouse = await this.fastify.transaction(async (client) => {
        const { rows: warehouses } = await client.query<Warehouse>(queryConfig);

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
            text: `INSERT INTO packaging_inventory (warehouse_id, packaging_id) VALUES ${placeholders};`,
            values,
          });
        }

        return warehouses[0];
      });

      return newWarehouse;
    } catch (error: unknown) {
      throw new BadRequestError(
        `WarehouseRepo.createNewWarehouse() method error: ${error}`
      );
    }
  }

  async updateWarehouseById(
    warehouseId: string,
    data: WarehouseRequestType["UpdateById"]["Body"]
  ): Promise<void> {
    if (Object.keys(data).length === 0) return;

    try {
      await this.fastify.transaction(async (client) => {
        console.log(data.packagingIds);
        if (data.packagingIds) {
          if (data.packagingIds.length > 0) {
            // delete warehouse
            await client.query({
              text: `DELETE FROM packaging_inventory
            WHERE warehouse_id = $1::text 
              AND packaging_id NOT IN (${data.packagingIds
                .map((_, i) => {
                  return `$${i + 2}::text`;
                })
                .join(", ")})
            RETURNING *;`,
              values: [warehouseId, ...data.packagingIds],
            });
            // insert warehouse
            await client.query({
              text: `INSERT INTO packaging_inventory (warehouse_id,packaging_id)
          VALUES ${data.packagingIds
            .map((_, i) => `($1, $${i + 2})`)
            .join(", ")} 
          ON CONFLICT DO NOTHING;`,
              values: [warehouseId, ...data.packagingIds],
            });
          } else {
            await client.query({
              text: `DELETE FROM packaging_inventory
            WHERE warehouse_id = $1::text RETURNING *;`,
              values: [warehouseId],
            });
          }
        }

        let idx = 1;
        const sets: string[] = [];
        const values: (number | string | null | Date)[] = [];
        if (data.name !== undefined) {
          sets.push(`"name" = $${idx++}`);
          values.push(data.name);
        }

        if (data.address !== undefined) {
          sets.push(`"address" = $${idx++}`);
          values.push(data.address);
        }

        if (data.status !== undefined) {
          sets.push(
            `status = $${idx++}::text`,
            `deactived_at = $${idx++}::timestamptz`
          );
          values.push(
            data.status,
            data.status === "ACTIVE" ? null : new Date()
          );
        }

        values.push(warehouseId);

        if (sets.length > 0) {
          const queryConfig: QueryConfig = {
            text: `UPDATE warehouses SET ${sets.join(
              ", "
            )} WHERE id = $${idx} RETURNING *;`,
            values,
          };
          await client.query<Warehouse>(queryConfig);
        }
      });
    } catch (error) {
      throw new BadRequestError(
        `WarehouseRepo.updateWarehouseById() method error: ${error}`
      );
    }
  }

  async deleteWarehouseById(id: string): Promise<Warehouse> {
    const queryConfig: QueryConfig = {
      text: `DELETE FROM warehouses WHERE id = $1 RETURNING *;`,
      values: [id],
    };
    try {
      const { rows } = await this.fastify.query<Warehouse>(queryConfig);
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new BadRequestError(
        `WarehouseRepo.deleteWarehouseById() method error: ${error}`
      );
    }
  }
}
