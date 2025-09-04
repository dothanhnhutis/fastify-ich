import { FastifyInstance } from "fastify";
import { QueryConfig, QueryResult } from "pg";
import { StatusCodes } from "http-status-codes";

import { CustomError } from "@/shared/error-handler";
import {
  CreateWarehouseBodyType,
  UpdateWarehouseBodyType,
} from "@/modules/v1/warehouse/warehouse.schema";

export default class WarehouseRepo {
  constructor(private fastify: FastifyInstance) {}

  async query(data: {
    name?: string;
    address?: string;
    sorts?: {
      field: string;
      direction: "asc" | "desc";
    }[];
    limit?: number;
    page?: number;
  }): Promise<{
    warehouses: Warehouse[];
    metadata: Metadata;
  }> {
    let queryString = ["SELECT * FROM warehouse"];
    const values: any[] = [];

    let where: string[] = [];
    let idx = 1;

    if (data.name != undefined) {
      where.push(`name ILIKE $${idx++}::text`);
      values.push(`%${data.name.trim()}%`);
    }

    if (data.address != undefined) {
      where.push(`address ILIKE $${idx++}::text`);
      values.push(`%${data.address.trim()}%`);
    }

    if (where.length > 0) {
      queryString.push(`WHERE ${where.join(" AND ")}`);
    }

    try {
      const { rows } = await this.req.pg.query<{ count: string }>({
        text: queryString.join(" ").replace("*", "count(*)"),
        values,
      });

      const totalItem = parseInt(rows[0].count);

      const fieldAllow = ["name", "address"];
      if (data.sorts != undefined) {
        queryString.push(
          `ORDER BY ${data.sorts
            .filter((sort) => fieldAllow.includes(sort.field))
            .map((sort) => `${sort.field} ${sort.direction.toUpperCase()}`)
            .join(", ")}`
        );
      }

      if (data.page != undefined) {
        const limit = data.limit ?? totalItem;
        const offset = (data.page - 1) * limit;
        queryString.push(`LIMIT $${idx++}::int OFFSET $${idx}::int`);
        values.push(limit, offset);
      }

      const queryConfig: QueryConfig = {
        text: queryString.join(" "),
        values,
      };

      const { rows: warehouses } = await this.req.pg.query<Warehouse>(
        queryConfig
      );

      const limit = data.limit ?? totalItem;
      const totalPage = Math.ceil(totalItem / limit);
      const page = data.page ?? 1;

      return {
        warehouses,
        metadata: {
          totalItem,
          totalPage,
          hasNextPage: page < totalPage,
          limit,
          itemStart: (page - 1) * limit + 1,
          itemEnd: Math.min(page * limit, totalItem),
        },
      };
    } catch (error: any) {
      throw new CustomError({
        message: `WarehouseRepo.query() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async findById(id: string): Promise<Warehouse | null> {
    const queryConfig: QueryConfig = {
      text: `SELECT * FROM warehouses WHERE id = $1 LIMIT 1`,
      values: [id],
    };
    try {
      const { rows }: QueryResult<Warehouse> =
        await this.fastify.query<Warehouse>(queryConfig);
      return rows[0] ?? null;
    } catch (error: any) {
      throw new CustomError({
        message: `WarehouseRepo.findById() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
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
            text: `INSERT INTO packaging_stocks (warehouse_id, packaging_id) VALUES ${placeholders}`,
            values,
          });
        }

        return warehouses[0];
      });

      return newWarehouse;
    } catch (error: unknown) {
      throw new CustomError({
        message: `WarehouseRepo.create() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async update(id: string, data: UpdateWarehouseBodyType): Promise<void> {
    if (Object.keys(data).length == 0) return;

    await this.fastify.transaction(async (client) => {
      if (data.packagingIds) {
      }

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

      if (values.length > 0) {
        const queryConfig: QueryConfig = {
          text: `UPDATE warehouses SET ${sets.join(
            ", "
          )} WHERE id = $${idx} RETURNING *;`,
          values,
        };

        const { rows: warehouses } = await client.query<Warehouse>(queryConfig);
      }
    });

    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      sets.push(`"name" = $${idx++}`);
      values.push(data.name);
    }

    if (data.address !== undefined) {
      sets.push(`"address" = $${idx++}`);
      values.push(data.address);
    }

    if (sets.length === 0) {
      return;
    }

    values.push(id);

    const queryConfig: QueryConfig = {
      text: `UPDATE warehouses SET ${sets.join(
        ", "
      )} WHERE id = $${idx} RETURNING *;`,
      values,
    };
    try {
      await this.fastify.query(queryConfig);
    } catch (error: unknown) {
      throw new CustomError({
        message: `WarehouseRepo.update() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
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
      throw new CustomError({
        message: `WarehouseRepo.delete() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }
}
