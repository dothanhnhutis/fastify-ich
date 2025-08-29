import { FastifyInstance } from "fastify";
import { QueryConfig, QueryResult } from "pg";
import { StatusCodes } from "http-status-codes";

import { CustomError } from "@/shared/error-handler";

import {
  CreateNewRoleBodyType,
  QueryRolesType,
  UpdateRoleByIdBodyType,
} from "@/modules/v1/roles/role.schema";

export default class RoleRepo {
  constructor(private fastify: FastifyInstance) {}

  async query(query: QueryRolesType): Promise<{
    roles: Role[];
    metadata: Metadata;
  }> {
    let queryString = ["SELECT * FROM roles"];
    const values: any[] = [];
    let where: string[] = [];
    let idx = 1;

    try {
      if (query.name != undefined) {
        where.push(`name ILIKE $${idx++}::text`);
        values.push(`%${query.name.trim()}%`);
      }

      if (query.permissions != undefined) {
        where.push(`permissions @> $${idx++}::text[]`);
        values.push(query.permissions);
      }

      if (query.description != undefined) {
        where.push(`description ILIKE $${idx++}::text`);
        values.push(`%${query.description.trim()}%`);
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
        // const fieldAllow = ["name.asc", "descript", "permissions"];

        queryString.push(
          `ORDER BY ${query.sort
            // .filter((sort) => fieldAllow.includes(sort))
            .map((sort) => {
              const [field, direction] = sort.split(".");
              return `${field} ${direction.toUpperCase()}`;
            })
            .join(", ")}`
        );
      }

      if (query.page != undefined) {
        const limit = query.limit ?? totalItem;
        const offset = (query.page - 1) * limit;
        queryString.push(`LIMIT $${idx++}::int OFFSET $${idx}::int`);
        values.push(limit, offset);
      }

      const queryConfig: QueryConfig = {
        text: queryString.join(" "),
        values,
      };

      const { rows: roles } = await this.fastify.query<Role>(queryConfig);

      const limit = query.limit ?? totalItem;
      const totalPage = Math.ceil(totalItem / limit);
      const page = query.page ?? 1;

      return {
        roles,
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
        message: `RoleRepo.query() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async findById(id: string): Promise<Role | null> {
    const queryConfig: QueryConfig = {
      text: `SELECT * FROM roles WHERE id = $1 LIMIT 1`,
      values: [id],
    };
    try {
      const { rows }: QueryResult<Role> = await this.fastify.query(queryConfig);
      return rows[0] ?? null;
    } catch (error: any) {
      throw new CustomError({
        message: `RoleRepo.findById() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async create(data: CreateNewRoleBodyType): Promise<Role> {
    const columns = ["name", "description", "permissions"];
    const values = [data.name, data.description, data.permissions];
    const placeholders = ["$1::text", "$2::text", "$3::text[]"];
    let idx = values.length;

    // if (data.description !== undefined) {
    //   columns.push("description");
    //   values.push(data.description);
    //   placeholders.push(`$${idx++}::text`);
    // }

    const queryConfig: QueryConfig = {
      text: `INSERT INTO roles (${columns.join(
        ", "
      )}) VALUES (${placeholders.join(", ")}) RETURNING *;`,
      values,
    };
    try {
      const { rows }: QueryResult<Role> = await this.fastify.query<Role>(
        queryConfig
      );
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new CustomError({
        message: `RoleRepo.create() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async update(id: string, data: UpdateRoleByIdBodyType): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      sets.push(`"name" = $${idx++}::text`);
      values.push(data.name);
    }
    if (data.permissions !== undefined) {
      sets.push(`"permissions" = $${idx++}::text[]`);
      values.push(data.permissions);
    }
    if (data.description !== undefined) {
      sets.push(`"description" = $${idx++}::text`);
      values.push(data.description);
    }

    if (sets.length === 0) {
      return;
    }

    values.push(id);

    const queryConfig: QueryConfig = {
      text: `UPDATE roles SET ${sets.join(
        ", "
      )} WHERE id = $${idx} RETURNING *;`,
      values,
    };

    try {
      await this.fastify.query(queryConfig);
    } catch (error: unknown) {
      throw new CustomError({
        message: `RoleRepo.update() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async delete(id: string): Promise<Role> {
    const queryConfig: QueryConfig = {
      text: `DELETE FROM roles WHERE id = $1 RETURNING *;`,
      values: [id],
    };
    try {
      const { rows }: QueryResult<Role> = await this.fastify.query(queryConfig);
      return rows[0] ?? null;
    } catch (error: unknown) {
      /**
       * TODO: bắt sự kiện role đã rán cho cho user
       */

      throw new CustomError({
        message: `RoleRepo.delete() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }
}
