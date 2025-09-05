import {
  CreateNewUserBodyType,
  QueryUsersType,
  UpdateUserByIdBodyType,
} from "@/modules/v1/users/user.schema";
import { BadRequestError, CustomError } from "@/shared/error-handler";
import Password from "@/shared/password";
import { FastifyInstance } from "fastify";
import { StatusCodes } from "http-status-codes";
import { QueryConfig, QueryResult } from "pg";

type CreateNewUser = {
  username: string;
  email: string;
  password: string;
  roleIds?: string[];
};

export default class UserRepo {
  constructor(private fastify: FastifyInstance) {}

  async findByEmail(email: string): Promise<User | null> {
    const queryConfig: QueryConfig = {
      text: `SELECT * FROM users WHERE email = $1 LIMIT 1;`,
      values: [email],
    };

    try {
      const { rows } = await this.fastify.query<User>(queryConfig);
      return rows[0] ?? null;
    } catch (err: unknown) {
      this.fastify.logger.error(
        { metadata: { query: queryConfig } },
        `UserRepo.findByEmail() method error: ${err}`
      );
      return null;
    }
  }

  async findById(id: string): Promise<User | null> {
    const queryConfig: QueryConfig = {
      text: `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      values: [id],
    };
    try {
      const { rows }: QueryResult<User> = await this.fastify.query(queryConfig);
      return rows[0] ?? null;
    } catch (err: unknown) {
      this.fastify.logger.error(
        { metadata: { query: queryConfig } },
        `UserRepo.findById() method error: ${err}`
      );
      return null;
    }
  }

  async findRoles(userId: string): Promise<Role[]> {
    const queryConfig: QueryConfig = {
      text: `SELECT * FROM roles WHERE id IN ( SELECT role_id FROM user_roles WHERE user_id = $1);`,
      values: [userId],
    };
    try {
      const { rows }: QueryResult<Role> = await this.fastify.query(queryConfig);
      return rows ?? null;
    } catch (err: unknown) {
      this.fastify.logger.error(
        { metadata: { query: queryConfig } },
        `UserRepo.findRoles() method error: ${err}`
      );
      return [];
    }
  }

  async query(
    query: QueryUsersType
  ): Promise<{ users: User[]; metadata: Metadata }> {
    let queryString = ["SELECT * FROM users"];
    const values: any[] = [];
    let where: string[] = [];
    let idx = 1;

    try {
      if (query.username != undefined) {
        where.push(`username ILIKE $${idx++}::text`);
        values.push(`%${query.username.trim()}%`);
      }

      if (query.email != undefined) {
        where.push(`email ILIKE $${idx++}::text`);
        values.push(`%${query.email.trim()}%`);
      }

      if (query.disabled != undefined) {
        where.push(
          query.disabled ? `disabled_at IS NOT NULL` : `disabled_at IS NULL`
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

      const { rows: users } = await this.fastify.query<User>(queryConfig);

      const totalPage = Math.ceil(totalItem / limit);

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
    } catch (error: any) {
      throw new CustomError({
        message: `UserRepo.query() method error: ${error}`,
        statusCode: StatusCodes.BAD_REQUEST,
        statusText: "BAD_REQUEST",
      });
    }
  }

  async create(data: CreateNewUser): Promise<User> {
    const password_hash = await Password.hash(data.password);

    const queryConfig: QueryConfig = {
      text: `INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *;`,
      values: [data.email, data.username, password_hash],
    };

    try {
      const newUser = await this.fastify.transaction(async (client) => {
        const { rows: userRow }: QueryResult<User> = await client.query(
          queryConfig
        );

        if (data.roleIds) {
          const values: any[] = [];

          const placeholder = data.roleIds
            .map((id, i) => {
              let idx = i * 2;
              values.push(userRow[0].id, id);
              return `($${idx + 1}, $${idx + 2})`;
            })
            .join(", ");

          await client.query({
            text: `INSERT INTO user_roles (user_id, role_id) VALUES ${placeholder}`,
            values,
          });
        }

        const channel = this.fastify.getChannel("publish-user-channel");
        channel.publish(
          "user-mail-direct",
          "create-new-user",
          Buffer.from(
            JSON.stringify({ email: data.email, password: data.password })
          ),
          { persistent: true }
        );

        return userRow[0];
      });

      return newUser;
    } catch (err: unknown) {
      this.fastify.log.error(
        { metadata: { query: queryConfig } },
        `UserRepo.create() method error: ${err}`
      );
      throw new BadRequestError("Tạo Người dùng thất bại");
    }
  }

  async update(userId: string, data: UpdateUserByIdBodyType): Promise<void> {
    if (Object.keys(data).length == 0) return;
    try {
      await this.fastify.transaction(async (client) => {
        const sets: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (data.username !== undefined) {
          sets.push(`"username" = $${idx++}::text`);
          values.push(data.username);
        }

        if (data.disable !== undefined) {
          sets.push(`"disabled_at" = $${idx++}::timestamptz`);
          values.push(data.disable ? new Date() : null);
        }

        if (values.length > 0) {
          values.push(userId);
          const queryConfig: QueryConfig = {
            text: `UPDATE users SET ${sets.join(
              ", "
            )} WHERE id = $${idx} RETURNING *;`,
            values,
          };
          await client.query(queryConfig);
        }

        if (data.roleIds) {
          // delete role
          await client.query({
            text: `DELETE FROM user_roles 
          WHERE user_id = $1::text 
            AND role_id NOT IN (${data.roleIds
              .map((_, i) => {
                return `$${i + 2}::text`;
              })
              .join(", ")}) 
          RETURNING *;`,
            values: [userId, ...data.roleIds],
          });

          // insert role
          await client.query({
            text: `INSERT INTO user_roles 
          VALUES ${data.roleIds.map((_, i) => `($1, $${i + 2})`).join(", ")} 
          ON CONFLICT DO NOTHING;`,
            values: [userId, ...data.roleIds],
          });
        }
      });
    } catch (error) {
      throw new BadRequestError(`UserRepo.update() method error: ${error}`);
    }
  }
}
