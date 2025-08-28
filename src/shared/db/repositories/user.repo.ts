import { CreateUserType } from "@/modules/v1/user/user.schema";
import Password from "@/shared/password";
import { FastifyInstance, FastifyRequest } from "fastify";
import { QueryConfig, QueryResult } from "pg";

export default class UserRepo {
  constructor(private req: FastifyInstance) {}

  async findByEmail(email: string): Promise<User | null> {
    const queryConfig: QueryConfig = {
      text: `SELECT * FROM users WHERE email = $1 LIMIT 1;`,
      values: [email],
    };

    try {
      const { rows } = await this.req.query<User>(queryConfig);
      return rows[0] ?? null;
    } catch (err: unknown) {
      this.req.logger.error(
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
      const { rows }: QueryResult<User> = await this.req.pg.query(queryConfig);
      return rows[0] ?? null;
    } catch (err: unknown) {
      this.req.logger.error(
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
      const { rows }: QueryResult<Role> = await this.req.pg.query(queryConfig);
      return rows ?? null;
    } catch (err: unknown) {
      this.req.logger.error(
        { metadata: { query: queryConfig } },
        `UserRepo.findRoles() method error: ${err}`
      );
      return [];
    }
  }

  async create(data: CreateUserType["body"] & { password_hash: string }) {
    const queryConfig: QueryConfig = {
      text: `INSERT INTO user (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *;`,
      values: [data.email, data.username, data.password_hash],
    };

    try {
      await this.req.pg.query("BEGIN");

      const { rows: userRow }: QueryResult<User> = await this.req.pg.query(
        queryConfig
      );

      if (data.roles) {
        const values: any[] = [];

        const placeholder = data.roles
          .map((id, i) => {
            let idx = i * 2;
            values.push(userRow[0].id, id);
            return `($${idx + 1}, $${idx + 2})`;
          })
          .join(", ");

        await this.req.pg.query({
          text: `INSERT INTO user_roles (user_id, role_id) VALUES ${placeholder}`,
          values,
        });
      }

      await this.req.pg.query("COMMIT");
      return userRow[0] ?? null;
    } catch (err: unknown) {
      await this.req.pg.query("ROLLBACK");
      this.req.logger.error(
        { metadata: { query: queryConfig } },
        `UserRepo.create() method error: ${err}`
      );
    }
  }
}
