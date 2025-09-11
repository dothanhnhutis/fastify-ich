import { FastifyInstance } from "fastify";
import { QueryConfig, QueryResult } from "pg";
import { StatusCodes } from "http-status-codes";

import {
  CreateNewRoleBodyType,
  QueryRolesType,
  UpdateRoleByIdBodyType,
} from "@/modules/v1/roles/role.schema";
import { isDataString } from "@/shared/utils";
import { CustomError } from "@/shared/error-handler";

export default class RoleRepo {
  constructor(private fastify: FastifyInstance) {}

  async query(query: QueryRolesType): Promise<QueryRoles> {
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

      const { rows: roles } = await this.fastify.query<Role>(queryConfig);

      const totalPage = Math.ceil(totalItem / limit);

      return {
        roles,
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
      throw new CustomError({
        message: `RoleRepo.query() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async findById(roleId: string): Promise<Role | null> {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            r.*,
            COUNT(ur.user_id)::int as user_count
        FROM
            roles r
            LEFT JOIN user_roles ur ON (ur.role_id = r.id)
        WHERE
            id = $1
        GROUP BY r.id
        LIMIT
            1;
      `,
      values: [roleId],
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

  async findUsersByRoleId(roleId: string): Promise<QueryUserRole> {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            r.*,
            COUNT(ur.user_id)::int as user_count
        FROM
            roles r
            LEFT JOIN user_roles ur ON (ur.role_id = r.id)
        WHERE
            id = $1
        GROUP BY r.id
        LIMIT
            1;
      `,
      values: [roleId],
    };
    try {
      const { rows }: QueryResult<Role> = await this.fastify.query(queryConfig);
      return rows[0] ?? null;
    } catch (error: any) {
      throw new CustomError({
        message: `RoleRepo.findUserByRoleId() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async findDetailById(roleId: string): Promise<any> {
    const queryConfig: QueryConfig = {
      text: `
        
      `,
      values: [roleId],
    };
    try {
      const { rows }: QueryResult<Role> = await this.fastify.query(queryConfig);
      return rows[0] ?? null;
    } catch (error: any) {
      throw new CustomError({
        message: `RoleRepo.findUserByRoleId() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async create(data: CreateNewRoleBodyType): Promise<Role> {
    const columns = ["name", "description", "permissions"];
    const values = [data.name, data.description, data.permissions];
    const placeholders = ["$1::text", "$2::text", "$3::text[]"];

    // let idx = values.length;
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
