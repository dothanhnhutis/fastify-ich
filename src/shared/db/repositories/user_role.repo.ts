import { QueryRolesType } from "@/modules/v1/roles/role.schema";
import { BadRequestError } from "@/shared/error-handler";
import { isDataString } from "@/shared/utils";
import { FastifyInstance } from "fastify";
import { QueryConfig, QueryResult } from "pg";

export default class UserRoleRepo {
  constructor(private fastify: FastifyInstance) {}

  async findRolesByUserId(
    userId: string,
    query?: QueryRolesType
  ): Promise<{ roles: Role[]; metadata: Metadata }> {
    const newTable = `
        WITH
            new_roles AS (
                SELECT
                    r.*
                FROM
                    user_roles ur
                    LEFT JOIN roles r ON (r.id = ur.role_id)
                WHERE
                    user_id = $1
            )
       
    `;

    const queryString = [`SELECT * FROM new_roles`];

    const values: any[] = [userId];
    let where: string[] = [];
    let idx = 2;

    if (query) {
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

      if (query.status != undefined) {
        where.push(
          `status = $${idx++}::text`,
          query.status == "ACTIVE"
            ? "deactived_at IS NULL"
            : "deactived_at IS NOT NULL"
        );
        values.push(query.status);
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

        const totalItem = parseInt(rows[0].count);

        if (query && query.sort != undefined) {
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

        let limit = query?.limit ?? totalItem;
        let page = query?.page ?? 1;
        let offset = (page - 1) * limit;

        queryString.push(`LIMIT $${idx++}::int OFFSET $${idx}::int`);
        values.push(limit, offset);

        const queryConfig: QueryConfig = {
          text: [newTable, queryString.join(" ")].join(" "),
          values,
        };

        const { rows: roles }: QueryResult<Role> =
          await this.fastify.query<Role>(queryConfig);

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
      });
    } catch (error) {
      throw new BadRequestError(
        `UserRoleRepo.findRolesByUserId() method error: ${error}`
      );
    }
  }
}
