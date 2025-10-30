import type { Role } from "@modules/shared/role/role.shared.types";
import type { User } from "@modules/shared/user/user.shared.types";
import { BadRequestError, CustomError } from "@shared/utils/error-handler";
import { isDateString } from "@shared/utils/helper";
import type { FastifyInstance } from "fastify";
import { StatusCodes } from "http-status-codes";
import type { QueryConfig, QueryResult } from "pg";
import type { RoleRequestType } from "./role.schema";
import type { IRoleRepository, RoleDetail } from "./role.types";

export default class RoleRepository implements IRoleRepository {
  constructor(private fastify: FastifyInstance) {}

  async findRoles(query: RoleRequestType["Query"]["Querystring"]) {
    console.log(query);
    const queryString = [
      `
      SELECT
          r.*,
          COUNT(ur.user_id) FILTER (
              WHERE
                  ur.user_id IS NOT NULL
                  AND u.status = 'ACTIVE'
                  AND u.deactived_at IS NULL
          )::int AS user_count
      FROM
          roles r
          LEFT JOIN user_roles ur ON (ur.role_id = r.id)
          LEFT JOIN users u ON (ur.user_id = u.id)
    `,
    ];

    const values: (string | number | string[])[] = [];
    const where: string[] = [];
    let idx = 1;

    try {
      if (query.name !== undefined) {
        where.push(`name ILIKE $${idx++}::text`);
        values.push(`%${query.name.trim()}%`);
      }

      if (query.permissions !== undefined) {
        where.push(`permissions @> $${idx++}::text[]`);
        values.push(query.permissions);
      }

      if (query.description !== undefined) {
        where.push(`description ILIKE $${idx++}::text`);
        values.push(`%${query.description.trim()}%`);
      }

      if (query.created_from) {
        where.push(`created_at >= $${idx++}::timestamptz`);
        values.push(
          `${
            isDateString(query.created_from.trim())
              ? `${query.created_from.trim()}T00:00:00.000Z`
              : query.created_from.trim()
          }`
        );
      }

      if (query.created_to) {
        where.push(`created_at <= $${idx++}::timestamptz`);
        values.push(
          `${
            isDateString(query.created_to.trim())
              ? `${query.created_to.trim()}T23:59:59.999Z`
              : query.created_to.trim()
          }`
        );
      }

      if (where.length > 0) {
        queryString.push(`WHERE ${where.join(" AND ")}`);
      }

      queryString.push(`GROUP BY r.id`);

      const { rows } = await this.fastify.query<{ count: string }>({
        text: `WITH roles AS (${queryString.join(
          " "
        )}) SELECT COUNT(*) FROM roles`,
        values,
      });
      const totalItem = parseInt(rows[0].count, 10);

      if (query.sort !== undefined) {
        queryString.push(
          `ORDER BY ${query.sort
            .map((sort) => {
              const [field, direction] = sort.split(".");
              return `${field} ${direction.toUpperCase()}`;
            })
            .join(", ")}`
        );
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

      const { rows: roles } = await this.fastify.query<Role>(queryConfig);

      const totalPage = Math.ceil(totalItem / limit) || 0;

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
    } catch (error: unknown) {
      throw new BadRequestError(`RoleRepo.query() method error: ${error}`);
    }
  }

  async findRolesv2(query: RoleRequestType["Query"]["Querystring"]) {
    const queryString = [
      `
      SELECT
          r.*,
          (
              SELECT COUNT(*)
              FROM user_roles ur2
              JOIN users u2 ON u2.id = ur2.user_id
              WHERE ur2.role_id = r.id
                AND u2.status = 'ACTIVE'
                AND u2.deactived_at IS NULL
          )::int AS user_count,
          COALESCE(
              json_agg(
                  json_build_object(
                      'id', u.id,
                      'email', u.email,
                      'has_password', (u.password_hash IS NOT NULL)::boolean,
                      'username', u.username,
                      'status', u.status,
                      'deactived_at', u.deactived_at,
                      'created_at', to_char(
                          u.created_at AT TIME ZONE 'UTC',
                          'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                      ),
                      'updated_at', to_char(
                          u.updated_at AT TIME ZONE 'UTC',
                          'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                      ),
                      'avatar', av.avatar
                  )
              ) FILTER (WHERE u.id IS NOT NULL),
              '[]'
          ) AS users
      FROM roles r
      LEFT JOIN LATERAL (
          SELECT u.*
          FROM user_roles ur
          JOIN users u ON u.id = ur.user_id
          WHERE ur.role_id = r.id
            AND u.status = 'ACTIVE'
            AND u.deactived_at IS NULL
          ORDER BY u.created_at DESC
          LIMIT 3
      ) u ON TRUE
      LEFT JOIN LATERAL (
          SELECT json_build_object(
              'id', av.file_id,
              'width', av.width,
              'height', av.height,
              'is_primary', av.is_primary,
              'original_name', f.original_name,
              'mime_type', f.mime_type,
              'destination', f.destination,
              'file_name', f.file_name,
              'size', f.size,
              'created_at', to_char(
                  av.created_at AT TIME ZONE 'UTC',
                  'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
              )
          ) AS avatar
          FROM user_avatars av
          JOIN files f ON f.id = av.file_id
          WHERE av.user_id = u.id
            AND av.deleted_at IS NULL
            AND av.is_primary = TRUE
          LIMIT 1
      ) av ON TRUE
    `,
    ];

    const values: (string | number | string[])[] = [];
    const where: string[] = [];
    let idx = 1;

    try {
      if (query.name !== undefined) {
        where.push(`name ILIKE $${idx++}::text`);
        values.push(`%${query.name.trim()}%`);
      }

      if (query.permissions !== undefined) {
        where.push(`permissions @> $${idx++}::text[]`);
        values.push(query.permissions);
      }

      if (query.status !== undefined) {
        where.push(`r.status = $${idx++}::text`);
        values.push(`${query.status}`);
      }

      if (query.description !== undefined) {
        where.push(`description ILIKE $${idx++}::text`);
        values.push(`%${query.description.trim()}%`);
      }

      if (query.created_from) {
        where.push(`created_at >= $${idx++}::timestamptz`);
        values.push(
          `${
            isDateString(query.created_from.trim())
              ? `${query.created_from.trim()}T00:00:00.000Z`
              : query.created_from.trim()
          }`
        );
      }

      if (query.created_to) {
        where.push(`created_at <= $${idx++}::timestamptz`);
        values.push(
          `${
            isDateString(query.created_to.trim())
              ? `${query.created_to.trim()}T23:59:59.999Z`
              : query.created_to.trim()
          }`
        );
      }

      if (where.length > 0) {
        queryString.push(`WHERE ${where.join(" AND ")}`);
      }

      queryString.push(`GROUP BY r.id`);

      const { rows } = await this.fastify.query<{ count: string }>({
        text: `WITH roles AS (${queryString.join(
          " "
        )}) SELECT COUNT(*) FROM roles`,
        values,
      });
      const totalItem = parseInt(rows[0].count, 10);

      if (query.sort !== undefined) {
        queryString.push(
          `ORDER BY ${query.sort
            .map((sort) => {
              const [field, direction] = sort.split(".");
              return `${field} ${direction.toUpperCase()}`;
            })
            .join(", ")}`
        );
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

      const { rows: roles } = await this.fastify.query<Role>(queryConfig);

      const totalPage = Math.ceil(totalItem / limit) || 0;

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
    } catch (error: unknown) {
      throw new BadRequestError(`RoleRepo.query() method error: ${error}`);
    }
  }

  async findRoleById(roleId: string) {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            r.*,
            COUNT(ur.user_id) FILTER (
                WHERE
                    ur.user_id IS NOT NULL
                    AND u.status = 'ACTIVE'
                    AND u.deactived_at IS NULL
            )::int AS user_count
        FROM
            roles r
            LEFT JOIN user_roles ur ON (ur.role_id = r.id)
            LEFT JOIN users u ON (ur.user_id = u.id)
        WHERE
            r.id = $1
        GROUP BY
            r.id
        LIMIT
            1;
      `,
      values: [roleId],
    };
    try {
      const { rows }: QueryResult<Role> = await this.fastify.query(queryConfig);
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new CustomError({
        message: `RoleRepo.findById() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async findUsersByRoleId(
    roleId: string,
    query?: RoleRequestType["GetUsersById"]["Querystring"]
  ) {
    const newTable = `
      WITH
        users AS (
          SELECT
              u.id,
              u.email,
              (u.password_hash IS NOT NULL)::boolean AS has_password,
              u.username,
              u.status,
              u.deactived_at,
              u.created_at,
              u.updated_at,
              CASE
                WHEN av.file_id IS NOT NULL THEN 
                  json_build_object(
                    'id',
                    av.file_id,
                    'width',
                    av.width,
                    'height',
                    av.height,
                    'is_primary',
                    av.is_primary,
                    'original_name',
                    f.original_name,
                    'mime_type',
                    f.mime_type,
                    'destination',
                    f.destination,
                    'file_name',
                    f.file_name,
                    'size',
                    f.size,
                    'created_at',
                    to_char(
                        av.created_at AT TIME ZONE 'UTC',
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                        )
                    )
                ELSE null
              END AS avatar
          FROM
              user_roles ur
              LEFT JOIN users u ON (u.id = ur.user_id)
              LEFT JOIN user_avatars av ON (u.id = av.user_id)
              LEFT JOIN files f ON f.id = av.file_id
          WHERE
              ur.role_id = $1::text
              AND u.status = 'ACTIVE'
              AND u.deactived_at IS NULL
        )
      `;

    const queryString = [`SELECT * FROM users`];

    const values: (string | number)[] = [roleId];
    const where: string[] = [];
    let idx = 2;

    if (query) {
      if (query.email !== undefined) {
        where.push(`email ILIKE $${idx++}::text`);
        values.push(`%${query.email.trim()}%`);
      }

      if (query.username !== undefined) {
        where.push(`username ILIKE $${idx++}::text`);
        values.push(`%${query.username.trim()}%`);
      }

      if (query.status !== undefined) {
        where.push(`status = $${idx++}::text`);
        values.push(query.status);
      }

      if (query.created_from) {
        where.push(`created_at >= $${idx++}::timestamptz`);
        values.push(
          `${
            isDateString(query.created_from.trim())
              ? `${query.created_from.trim()}T00:00:00.000Z`
              : query.created_from.trim()
          }`
        );
      }

      if (query.created_to) {
        where.push(`created_at <= $${idx++}::timestamptz`);
        values.push(
          `${
            isDateString(query.created_to.trim())
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

        const totalItem = parseInt(rows[0].count, 10);

        if (query?.sort !== undefined) {
          queryString.push(
            `ORDER BY ${query.sort
              .map((sort) => {
                const [field, direction] = sort.split(".");
                return `${field} ${direction.toUpperCase()}`;
              })
              .join(", ")}`
          );
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

        const { rows: users } = await client.query<User>(queryConfig);

        const totalPage = Math.ceil(totalItem / limit) || 0;

        return {
          users,
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
        `RoleRepo.findUsersByRoleId() method error: ${error}`
      );
    }
  }

  async findRoleDetailById(roleId: string) {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            r.*,
            COUNT(ur.user_id) FILTER (
                WHERE
                    ur.user_id IS NOT NULL
                    AND u.status = 'ACTIVE'
                    AND u.deactived_at IS NULL
            )::int AS user_count,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id',
                        u.id,
                        'email',
                        u.email,
                        'has_password',
                        (u.password_hash IS NOT NULL)::boolean,
                        'username',
                        u.username,
                        'status',
                        u.status,
                        'deactived_at',
                        u.deactived_at,
                        'created_at',
                        to_char(
                            u.created_at AT TIME ZONE 'UTC',
                            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                        ),
                        'updated_at',
                        to_char(
                            u.updated_at AT TIME ZONE 'UTC',
                            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                        )
                    )
                ) FILTER (
                    WHERE
                        u.id IS NOT NULL
                        AND u.status = 'ACTIVE'
                        AND u.deactived_at IS NULL    
                ),
                '[]'
            ) AS users
        FROM
            roles r
            LEFT JOIN user_roles ur ON (ur.role_id = r.id)
            LEFT JOIN users u ON (ur.user_id = u.id)
        WHERE
            r.id = $1
        GROUP BY
            r.id;
      `,
      values: [roleId],
    };
    try {
      const { rows } = await this.fastify.query<RoleDetail>(queryConfig);
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new CustomError({
        message: `RoleRepo.findDetailById() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async create(data: RoleRequestType["Create"]["Body"]) {
    const columns = ["name", "description", "permissions"];
    const values = [data.name, data.description, data.permissions];
    const placeholders = ["$1::text", "$2::text", "$3::text[]"];

    const queryConfig: QueryConfig = {
      text: `INSERT INTO roles (${columns.join(
        ", "
      )}) VALUES (${placeholders.join(", ")}) RETURNING *;`,
      values,
    };

    try {
      return await this.fastify.transaction<Role>(async (client) => {
        const { rows }: QueryResult<Role> = await client.query<Role>(
          queryConfig
        );
        const newRole = rows[0];

        if (data.userIds.length > 0)
          await client.query({
            text: `INSERT INTO user_roles (role_id, user_id) VALUES ${data.userIds
              .map((_, idx) => `($1, $${idx + 2})`)
              .join(", ")};`,
            values: [newRole.id, ...data.userIds],
          });

        return newRole;
      });
    } catch (error: unknown) {
      throw new CustomError({
        message: `RoleRepo.create() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async update(id: string, data: RoleRequestType["UpdateById"]["Body"]) {
    const sets: string[] = [];
    const values: (string | string[] | Date | null)[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      sets.push(`name = $${idx++}::text`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      sets.push(`description = $${idx++}::text`);
      values.push(data.description);
    }
    if (data.permissions !== undefined) {
      sets.push(`permissions = $${idx++}::text[]`);
      values.push(data.permissions);
    }
    if (data.status !== undefined) {
      sets.push(
        `status = $${idx++}::text`,
        `deactived_at = ${
          data.status === "ACTIVE" ? `$${idx++}` : `$${idx++}::timestamptz`
        }`
      );
      values.push(data.status, data.status === "ACTIVE" ? null : new Date());
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
      await this.fastify.transaction(async (client) => {
        await client.query(queryConfig);

        if (data.userIds) {
          if (data.userIds.length === 0) {
            // xoá hết
            await client.query({
              text: `
              DELETE FROM user_roles
              WHERE
                  role_id = $1
              RETURNING *;
            `,
              values: [id],
            });
          } else {
            // xoá
            await client.query({
              text: `
              DELETE FROM user_roles
              WHERE
                  role_id = $1
                  AND user_id = ALL($2::text[])
              RETURNING *;
            `,
              values: [id, data.userIds],
            });
            // tạo mới
            await client.query({
              text: `
              INSERT INTO user_roles (role_id, user_id) 
              VALUES ${data.userIds
                .map((_, idx) => `($1, $${idx + 2})`)
                .join(", ")}
              ON CONFLICT DO NOTHING;
            `,
              values: [id, ...data.userIds],
            });
          }
        }
      });
    } catch (error: unknown) {
      throw new CustomError({
        message: `RoleRepo.update() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async delete(id: string) {
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
