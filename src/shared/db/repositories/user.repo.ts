import {
  CreateNewUserBodyType,
  UpdateUserByIdBodyType,
} from "@/modules/v1/users/user.schema";
import { BadRequestError } from "@/shared/error-handler";
import Password from "@/shared/password";
import { FastifyInstance } from "fastify";
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

  async create(data: CreateNewUser) {
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

  async updateRole(userId: string, roleIds: string[]) {
    try {
      await this.fastify.transaction(async (client) => {
        // delete user_role
        let i: number = 1;
        let value: string[] = [userId];

        client.query({
          text: `DELETE FROM user_roles WHERE user_id = $1::text AND role_id NOT IN ('d12e2e48-5f90-4568-99c0-15e2088829a7');`,
          values: value,
        });

        //create user_role
      });
    } catch (error) {}
  }

  async update(userId: string, data: UpdateUserByIdBodyType) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.username !== undefined) {
      sets.push(`"username" = $${idx++}::text`);
      values.push(data.username);
    }

    if (data.disable !== undefined) {
      sets.push(`"disable_at" = $${idx++}::boolean`);
      values.push(data.disable ? new Date() : null);
    }

    if (data.roleIds !== undefined) {
      sets.push(`"disable_at" = $${idx++}::boolean`);
      values.push(data.disable ? new Date() : null);
    }

    if (sets.length === 0) {
      return;
    }
    values.push(userId);

    const queryConfig: QueryConfig = {
      text: `UPDATE users SET ${sets.join(
        ", "
      )} WHERE id = $${idx} RETURNING *;`,
      values,
    };
  }
}
