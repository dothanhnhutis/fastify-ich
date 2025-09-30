import sharp from "sharp";
import { QueryConfig } from "pg";
import { FastifyInstance } from "fastify";

import { UserRequsetType } from "@/modules/v1/users/user.schema";
import Password from "@/shared/password";
import { MultipartFile } from "@fastify/multipart";
import { BadRequestError } from "@/shared/error-handler";
import { deleteFile, isDataString } from "@/shared/utils";
import { RoleRequestType } from "@/modules/v1/roles/role.schema";
import { privateFileUpload, type FileUploadType } from "@/shared/upload";

export default class UserRepo {
  constructor(private fastify: FastifyInstance) {}

  async findUserWithoutPasswordById(
    id: string
  ): Promise<UserWithoutPassword | null> {
    const queryConfig: QueryConfig = {
      text: `
      SELECT
          u.id,
          u.email,
          (u.password_hash IS NOT NULL)::boolean AS has_password,
          u.username,
          u.status,
          u.deactived_at,
          u.created_at,
          u.updated_at,
          COUNT(r.id) FILTER (
              WHERE
                  r.id IS NOT NULL
                  AND r.status = 'ACTIVE'
          )::int AS role_count,
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
          END 
          AS avatar
      FROM
          users u
          LEFT JOIN user_roles ur ON ur.user_id = u.id
          LEFT JOIN roles r ON ur.role_id = r.id
          LEFT JOIN user_avatars av ON av.user_id = u.id
          AND av.deleted_at IS NULL
          AND av.is_primary = true
          LEFT JOIN files f ON f.id = av.file_id
          AND f.deleted_at IS NULL
      WHERE
          u.id = $1::text
      GROUP BY
          u.id,
          u.email,
          u.password_hash,
          u.username,
          u.status,
          u.deactived_at,
          u.created_at,
          u.updated_at,
          av.file_id,
          av.width,
          av.height,
          av.is_primary,
          av.created_at,
          f.original_name,
          f.mime_type,
          f.destination,
          f.file_name,
          f.size
      LIMIT
          1;
      `,
      values: [id],
    };
    try {
      const { rows } = await this.fastify.query<UserWithoutPassword>(
        queryConfig
      );
      return rows[0] ?? null;
    } catch (err: unknown) {
      this.fastify.logger.error(
        { metadata: { query: queryConfig } },
        `UserRepo.findUserWithoutPasswordById() method error: ${err}`
      );
      return null;
    }
  }

  async findUserWithoutPasswordByEmail(
    email: string
  ): Promise<UserWithoutPassword | null> {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            u.id,
            u.email,
            (u.password_hash IS NOT NULL)::boolean AS has_password,
            u.username,
            u.status,
            u.deactived_at,
            u.created_at,
            u.updated_at,
            COUNT(r.id) FILTER (
                WHERE
                    r.id IS NOT NULL
                    AND r.status = 'ACTIVE'
            )::int AS role_count,
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
            END 
            AS avatar
        FROM
            users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON ur.role_id = r.id
            LEFT JOIN user_avatars av ON av.user_id = u.id
            AND av.deleted_at IS NULL
            AND av.is_primary = true
            LEFT JOIN files f ON f.id = av.file_id
            AND f.deleted_at IS NULL
        WHERE
            u.email = $1::text
        GROUP BY
            u.id,
            u.email,
            u.password_hash,
            u.username,
            u.status,
            u.deactived_at,
            u.created_at,
            u.updated_at,
            av.file_id,
            av.width,
            av.height,
            av.is_primary,
            av.created_at,
            f.original_name,
            f.mime_type,
            f.destination,
            f.file_name,
            f.size
        LIMIT
            1;
      `,
      values: [email],
    };
    try {
      const { rows } = await this.fastify.query<UserWithoutPassword>(
        queryConfig
      );
      return rows[0] ?? null;
    } catch (err: unknown) {
      this.fastify.logger.error(
        { metadata: { query: queryConfig } },
        `UserRepo.findUserWithoutPasswordByEmail() method error: ${err}`
      );
      return null;
    }
  }

  async findUserById(userId: string): Promise<UserPassword | null> {
    const queryConfig: QueryConfig = {
      text: `
      SELECT
          u.*,
          COUNT(r.id) FILTER (
              WHERE
                  r.id IS NOT NULL
                  AND r.status = 'ACTIVE'
          )::int AS role_count,
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
          END 
          AS avatar
      FROM
          users u
          LEFT JOIN user_roles ur ON ur.user_id = u.id
          LEFT JOIN roles r ON ur.role_id = r.id
          LEFT JOIN user_avatars av ON av.user_id = u.id
          AND av.deleted_at IS NULL
          AND av.is_primary = true
          LEFT JOIN files f ON f.id = av.file_id
          AND f.deleted_at IS NULL
      WHERE
          u.id = $1::text
      GROUP BY
          u.id,
          u.email,
          u.password_hash,
          u.username,
          u.status,
          u.deactived_at,
          u.created_at,
          u.updated_at,
          av.file_id,
          av.width,
          av.height,
          av.is_primary,
          av.created_at,
          f.original_name,
          f.mime_type,
          f.destination,
          f.file_name,
          f.size
      LIMIT
          1;
      `,
      values: [userId],
    };

    try {
      const { rows } = await this.fastify.query<UserPassword>(queryConfig);
      return rows[0] ?? null;
    } catch (err: unknown) {
      this.fastify.logger.error(
        { metadata: { query: queryConfig } },
        `UserRepo.findUserPasswordById() method error: ${err}`
      );
      return null;
    }
  }

  async findUserByEmail(email: string): Promise<UserPassword | null> {
    const queryConfig: QueryConfig = {
      text: `
      SELECT
          u.*,
          COUNT(r.id) FILTER (
              WHERE
                  r.id IS NOT NULL
                  AND r.status = 'ACTIVE'
          )::int AS role_count,
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
          END 
          AS avatar
      FROM
          users u
          LEFT JOIN user_roles ur ON ur.user_id = u.id
          LEFT JOIN roles r ON ur.role_id = r.id
          LEFT JOIN user_avatars av ON av.user_id = u.id
          AND av.deleted_at IS NULL
          AND av.is_primary = true
          LEFT JOIN files f ON f.id = av.file_id
          AND f.deleted_at IS NULL
      WHERE
          u.email = $1::text
      GROUP BY
          u.id,
          u.email,
          u.password_hash,
          u.username,
          u.status,
          u.deactived_at,
          u.created_at,
          u.updated_at,
          av.file_id,
          av.width,
          av.height,
          av.is_primary,
          av.created_at,
          f.original_name,
          f.mime_type,
          f.destination,
          f.file_name,
          f.size
      LIMIT
          1;
      `,
      values: [email],
    };

    try {
      const { rows } = await this.fastify.query<UserPassword>(queryConfig);
      return rows[0] ?? null;
    } catch (err: unknown) {
      this.fastify.logger.error(
        { metadata: { query: queryConfig } },
        `UserRepo.findUserPasswordByEmail() method error: ${err}`
      );
      return null;
    }
  }

  async findUserDetailById(userId: string): Promise<UserDetail | null> {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            u.id,
            u.email,
            (u.password_hash IS NOT NULL)::boolean AS has_password,
            u.username,
            u.status,
            u.deactived_at,
            u.created_at,
            u.updated_at,
            COUNT(r.id) FILTER (
                WHERE
                    r.id IS NOT NULL
                    AND r.status = 'ACTIVE'
            )::int AS role_count,
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
            END 
            AS avatar,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id',
                        r.id,
                        'name',
                        r.name,
                        'permissions',
                        r.permissions,
                        'description',
                        r.description,
                        'status',
                        r.status,
                        'deactived_at',
                        r.deactived_at,
                        'created_at',
                        r.created_at,
                        'updated_at',
                        r.updated_at
                    )
                ) FILTER (
                    WHERE
                        r.id IS NOT NULL
                        AND r.status = 'ACTIVE'
                ),
                '[]'
            ) AS roles
        FROM
            users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON ur.role_id = r.id
            LEFT JOIN user_avatars av ON av.user_id = u.id
            AND av.deleted_at IS NULL
            AND av.is_primary = true
            LEFT JOIN files f ON f.id = av.file_id
            AND f.deleted_at IS NULL
        WHERE
            u.id = $1::text
        GROUP BY
            u.id,
            u.email,
            u.password_hash,
            u.username,
            u.status,
            u.deactived_at,
            u.created_at,
            u.updated_at,
            av.file_id,
            av.width,
            av.height,
            av.is_primary,
            av.created_at,
            f.original_name,
            f.mime_type,
            f.destination,
            f.file_name,
            f.size
        LIMIT
            1;
      `,
      values: [userId],
    };
    try {
      const { rows: userDetails } = await this.fastify.query<UserDetail>(
        queryConfig
      );
      return userDetails[0] ?? null;
    } catch (err: unknown) {
      // this.fastify.logger.error(
      //   { metadata: { query: queryConfig } },
      //   `UserRepo.findUserDetailById() method error: ${err}`
      // );
      return null;
    }
  }

  async findRolesByUserId(
    userId: string,
    query?: RoleRequestType["Query"]["Querystring"]
  ): Promise<QueryRoles> {
    const newTable = `
      WITH
        roles AS (
            SELECT
                r.*
            FROM
                user_roles ur
                LEFT JOIN roles r ON (r.id = ur.role_id)
            WHERE
                user_id = $1::text
                AND r.status = 'ACTIVE'
                AND r.deactived_at IS NULL
        )
    `;

    const queryString = [`SELECT * FROM roles`];

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

        const { rows: roles } = await client.query<Role>(queryConfig);

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
    } catch (err: unknown) {
      // this.fastify.logger.error(
      //   { metadata: { query: queryConfig } },
      //   `UserRepo.findUserRoles() method error: ${err}`
      // );
      throw new BadRequestError(
        `PackagingStockRepo.findRolesByUserId() method error: ${err}`
      );
    }
  }

  async findUsers(
    query: UserRequsetType["Query"]["Querystring"]
  ): Promise<QueryUsers> {
    let queryString = [
      `
      SELECT
          u.id,
          u.email,
          (u.password_hash IS NOT NULL)::boolean AS has_password,
          u.username,
          u.status,
          u.deactived_at,
          u.created_at,
          u.updated_at,
          COUNT(r.id) FILTER (
              WHERE
                  r.id IS NOT NULL
                  AND r.status = 'ACTIVE'
          )::int AS role_count,
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
          END 
          AS avatar
      FROM
          users u
          LEFT JOIN user_roles ur ON ur.user_id = u.id
          LEFT JOIN roles r ON ur.role_id = r.id
          LEFT JOIN user_avatars av ON av.user_id = u.id
          AND av.deleted_at IS NULL
          AND av.is_primary = true
          LEFT JOIN files f ON f.id = av.file_id
          AND f.deleted_at IS NULL
      
      `,
    ];
    const values: any[] = [];
    let where: string[] = [];
    let idx = 1;

    if (query.username != undefined) {
      where.push(`u.username ILIKE $${idx++}::text`);
      values.push(`%${query.username.trim()}%`);
    }

    if (query.email != undefined) {
      where.push(`u.email ILIKE $${idx++}::text`);
      values.push(`%${query.email.trim()}%`);
    }

    if (query.status != undefined) {
      where.push(`u.status = $${idx++}::text`);
      values.push(`${query.status}`);
    }

    if (query.created_from) {
      where.push(`u.created_at >= $${idx++}::timestamptz`);
      values.push(
        `${
          isDataString(query.created_from.trim())
            ? `${query.created_from.trim()}T00:00:00.000Z`
            : query.created_from.trim()
        }`
      );
    }

    if (query.created_to) {
      where.push(`u.created_at <= $${idx++}::timestamptz`);
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

    queryString.push(`GROUP BY u.id, u.email, u.password_hash, u.username, u.status,
          u.deactived_at, u.created_at, u.updated_at, av.file_id, av.width, av.height,
          av.is_primary, av.created_at, f.original_name, f.mime_type, f.destination,
          f.file_name, f.size`);

    try {
      return await this.fastify.transaction(async (client) => {
        const { rows } = await client.query<{ count: string }>({
          // text: queryString
          //   .join(" ")
          //   .replace(/(?<=SELECT)([\s\S]*?)(?=FROM)/, " count(*) "),
          text: `WITH users AS (${queryString.join(
            " "
          )}) SELECT count(*) FROM users;`,
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

        const { rows: users } = await client.query<UserWithoutPassword>(
          queryConfig
        );

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

  async createNewUser(
    data: UserRequsetType["Create"]["Body"]
  ): Promise<UserPassword> {
    const password = data.password ?? Password.generate();
    const password_hash = await Password.hash(password);

    const queryConfig: QueryConfig = {
      text: `INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *;`,
      values: [data.email, data.username, password_hash],
    };

    try {
      const newUser = await this.fastify.transaction(async (client) => {
        const { rows: userRow } = await client.query<UserPassword>(queryConfig);

        if (data.roleIds && data.roleIds.length > 0) {
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

  async updateUserById(
    userId: string,
    data: UserRequsetType["UpdateById"]["Body"]
  ): Promise<void> {
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

  async updateAvatarById(userId: string, data: MultipartFile) {
    let file: FileUploadType = await privateFileUpload.singleUpload(data, {
      subDir: "avatars",
    });
    try {
      await this.fastify.transaction(async (client) => {
        const queryConfig: QueryConfig = {
          text: `
            INSERT INTO files (original_name, mime_type, destination, file_name, path, size, owner_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;      
          `,
          values: [
            file.fileName,
            file.mimeType,
            file.destination,
            file.fileName,
            file.path,
            file.size,
            userId,
          ],
        };

        const { rows: files } = await client.query<FileUpload>(queryConfig);

        const metadata = await sharp(files[0].path).metadata();

        await client.query({
          text: `
            INSERT INTO user_avatars (user_id, file_id, width, height, is_primary)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
          `,
          values: [userId, files[0].id, metadata.width, metadata.height, true],
        });
      });
    } catch (error) {
      deleteFile(file.path);
      throw new BadRequestError(
        `UserRepo.updateAvatarById() method error: ${error}`
      );
    }
  }
}
