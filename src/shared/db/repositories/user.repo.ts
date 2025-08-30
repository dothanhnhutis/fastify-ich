import { CreateNewUserBodyType } from "@/modules/v1/users/user.schema";
import { FastifyInstance } from "fastify";
import { QueryConfig, QueryResult } from "pg";

type CreateUserType = {
  username: string;
  email: string;
  password_hash: string;
  roleIds: string[];
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

  async create(data: CreateUserType) {
    const queryConfig: QueryConfig = {
      text: `INSERT INTO user (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *;`,
      values: [data.email, data.username, data.password_hash],
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

        return userRow[0];
      });

      // const channel = this.fastify.getChannel("publish-user-channel");
      // channel.publish(
      //   "user-mail-direct",
      //   "create-new-user",
      //   Buffer.from(JSON.stringify(newUser)),
      //   { persistent: true }
      // );

      return newUser;
    } catch (err: unknown) {
      this.fastify.log.error(
        { metadata: { query: queryConfig } },
        `UserRepo.create() method error: ${err}`
      );
      throw err;
    }
  }
}
