import {
  CreateNewUserBodyType,
  QueryUsersType,
  UpdateUserByIdBodyType,
} from "@/modules/v1/users/user.schema";
import { BadRequestError } from "@/shared/error-handler";
import Password from "@/shared/password";
import { isDataString } from "@/shared/utils";
import { FastifyInstance } from "fastify";
import { QueryConfig, QueryResult } from "pg";

export default class UserRepo {
  constructor(private fastify: FastifyInstance) {}

  async findByEmail(email: string): Promise<User | null> {
    const queryConfig: QueryConfig = {
      text: `
      SELECT
          id,
          email,
          (password_hash IS NOT NULL)::boolean AS has_password,
          username,
          status,
          deactived_at,
          created_at,
          updated_at
      FROM
          users
      WHERE
          email = $1
      LIMIT
          1;
      `,
      values: [email],
    };

    try {
      const { rows } = await this.fastify.query<User>(queryConfig);
      return rows[0] ?? null;
    } catch (err: unknown) {
      this.fastify.logger.error(
        { metadata: { query: queryConfig } },
        `UserRepo.findUserByEmail() method error: ${err}`
      );
      return null;
    }
  }

  async findById(id: string): Promise<User | null> {
    const queryConfig: QueryConfig = {
      text: `
      SELECT
          id,
          email,
          (password_hash IS NOT NULL)::boolean AS has_password,
          username,
          status,
          deactived_at,
          created_at,
          updated_at
      FROM
          users
      WHERE
          id = $1
      LIMIT
          1;
      `,
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

  async findDetailById(id: string): Promise<User | null> {
    try {
      const user = await this.findById(id);
      const roles = await this.findUserRoles(id);

      return {
        ...user,
        roles,
      };
    } catch (err: unknown) {
      // this.fastify.logger.error(
      //   { metadata: { query: queryConfig } },
      //   `UserRepo.findDetailById() method error: ${err}`
      // );
      return null;
    }
  }

  async findUserRoles(userId: string): Promise<Role[]> {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            r.*
        FROM
            user_roles ur
            LEFT JOIN roles r ON (r.id = ur.role_id)
        WHERE
            user_id = $1 
            AND r.status = 'ACTIVE'
            AND r.deactived_at IS NULL;
      `,
      values: [userId],
    };
    try {
      const { rows }: QueryResult<Role> = await this.fastify.query(queryConfig);
      return rows ?? null;
    } catch (err: unknown) {
      this.fastify.logger.error(
        { metadata: { query: queryConfig } },
        `UserRepo.findUserRoles() method error: ${err}`
      );
      return [];
    }
  }

  async query(
    query: QueryUsersType
  ): Promise<{ users: User[]; metadata: Metadata }> {
    let queryString = [
      `
      SELECT
          id,
          email,
          (password_hash IS NOT NULL)::boolean AS has_password,
          username,
          status,
          deactived_at,
          created_at,
          updated_at
      FROM
          users
      `,
    ];
    const values: any[] = [];
    let where: string[] = [];
    let idx = 1;

    if (query.username != undefined) {
      where.push(`username ILIKE $${idx++}::text`);
      values.push(`%${query.username.trim()}%`);
    }

    if (query.email != undefined) {
      where.push(`email ILIKE $${idx++}::text`);
      values.push(`%${query.email.trim()}%`);
    }

    if (query.status != undefined) {
      where.push(`status = $${idx++}::text`);
      values.push(`${query.status}`);
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

    try {
      return await this.fastify.transaction(async (client) => {
        const { rows } = await client.query<{ count: string }>({
          text: queryString
            .join(" ")
            .replace(/(?<=SELECT)([\s\S]*?)(?=FROM)/, " count(*) "),
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
    } catch (error: any) {
      throw new BadRequestError(`UserRepo.query() method error: ${error}`);
    }
  }

  async create(data: CreateNewUserBodyType): Promise<User> {
    const password = data.password ?? Password.generate();
    const password_hash = await Password.hash(password);

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
          Buffer.from(JSON.stringify({ email: data.email, password })),
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
          sets.push(`username = $${idx++}::text`);
          values.push(data.username);
        }

        if (data.status !== undefined) {
          sets.push(
            `status = $${idx++}::text`,
            `deactived_at = $${idx++}::timestamptz`
          );
          values.push(data.status, data.status == "ACTIVE" ? null : new Date());
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
          if (data.roleIds.length > 0) {
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
          } else {
            await client.query({
              text: `DELETE FROM user_roles
            WHERE user_id = $1::text RETURNING *;`,
              values: [userId],
            });
          }
        }
      });
    } catch (error) {
      throw new BadRequestError(`UserRepo.update() method error: ${error}`);
    }
  }
}
