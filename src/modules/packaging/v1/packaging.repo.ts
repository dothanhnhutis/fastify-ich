import type { FileUpload } from "@modules/shared/file/file.shared.types";
import type { MulterFile } from "@shared/middleware/multer";
import { BadRequestError } from "@shared/utils/error-handler";
import { deleteFile } from "@shared/utils/file";
import type { FastifyInstance } from "fastify";
import type { QueryConfig } from "pg";
import sharp from "sharp";
import type { PackagingRequestType } from "./packaging.schema";
import type {
  IPackagingRepository,
  Packaging,
  PackagingDetail,
  StockAt,
} from "./packaging.types";

export default class PackagingRepository implements IPackagingRepository {
  constructor(private fastify: FastifyInstance) {}

  async findPackagings(query: PackagingRequestType["Query"]["Querystring"]) {
    const queryString = [
      `
      SELECT
          p.*,
          CASE
              WHEN pim.file_id IS NOT NULL THEN
                  json_build_object(
                      'id',
                      pim.file_id,
                      'width',
                      pim.width,
                      'height',
                      pim.height,
                      'is_primary',
                      pim.is_primary,
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
                          pim.created_at AT TIME ZONE 'UTC',
                          'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                          )
                   )
            ELSE null
          END 
          AS image,
          COUNT(pi.warehouse_id) FILTER (
              WHERE
                  pi.warehouse_id IS NOT NULL
                  AND w.status = 'ACTIVE'
          )::int as warehouse_count,
          COALESCE(
              SUM(pi.quantity) FILTER (
                  WHERE
                      pi.warehouse_id IS NOT NULL
              ),
              0
          )::int as total_quantity
      FROM
          packagings p
          LEFT JOIN packaging_inventory pi ON (pi.packaging_id = p.id)
          LEFT JOIN warehouses w ON (pi.warehouse_id = w.id)
          LEFT JOIN packaging_images pim ON pim.packaging_id = p.id
              AND pim.deleted_at IS NULL AND pim.is_primary = true
          LEFT JOIN files f ON f.id = pim.file_id
              AND pim.deleted_at IS NULL
      `,
    ];
    const values: (string | number)[] = [];
    const where: string[] = [];
    let idx = 1;

    if (query.name !== undefined) {
      where.push(`p.name ILIKE $${idx++}::text`);
      values.push(`%${query.name.trim()}%`);
    }

    if (query.unit !== undefined) {
      where.push(`p.unit = $${idx++}::text`);
      values.push(query.unit);
    }

    if (query.status !== undefined) {
      where.push(
        `status = $${idx++}::text`,
        query.status === "ACTIVE"
          ? "deactived_at IS NULL"
          : "deactived_at IS NOT NULL"
      );
      values.push(query.status);
    }

    if (query.created_from) {
      where.push(`p.created_at >= $${idx++}::timestamptz`);
      values.push(query.created_from);
    }

    if (query.created_to) {
      where.push(`p.created_at <= $${idx++}::timestamptz`);
      values.push(query.created_to);
    }

    if (where.length > 0) {
      queryString.push(`WHERE ${where.join(" AND ")}`);
    }

    queryString.push(`GROUP BY p.id, p.name, p.min_stock_level, p.unit, p.pcs_ctn, p.status,
	                p.deactived_at, p.created_at, p.updated_at, pim.file_id, pim.width, pim.height,
                  pim.is_primary, pim.created_at, f.original_name, f.mime_type, f.destination, f.file_name,
                  f.size`);

    try {
      return await this.fastify.transaction(async (client) => {
        const { rows } = await client.query<{ count: string }>({
          text: `WITH grouped AS (${queryString.join(
            " "
          )}) SELECT  COUNT(*)::int AS count FROM grouped;`,
          values,
        });
        const totalItem = parseInt(rows[0].count, 10);

        if (query.sort !== undefined) {
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

        const limit = query.limit ?? totalItem;
        const page = query.page ?? 1;
        const offset = (page - 1) * limit;

        queryString.push(`LIMIT $${idx++}::int OFFSET $${idx}::int`);
        values.push(limit, offset);

        const queryConfig: QueryConfig = {
          text: queryString.join(" "),
          values,
        };

        const { rows: packagings } = await client.query<Packaging>(queryConfig);

        const totalPage = Math.ceil(totalItem / limit) || 0;

        return {
          packagings,
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
      throw new BadRequestError(`PackagingRepo.query() method error: ${error}`);
    }
  }

  async findPackagingById(packagingId: string) {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            p.*,
            CASE
                WHEN pim.file_id IS NOT NULL THEN
                    json_build_object(
                        'id',
                        pim.file_id,
                        'width',
                        pim.width,
                        'height',
                        pim.height,
                        'is_primary',
                        pim.is_primary,
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
                            pim.created_at AT TIME ZONE 'UTC',
                            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                            )
                    )
                    ELSE null
                END 
                    AS image,
            COUNT(pi.warehouse_id) FILTER (
                WHERE
                    pi.warehouse_id IS NOT NULL
                    AND w.status = 'ACTIVE'
            )::int as warehouse_count,
            COALESCE(
                SUM(pi.quantity) FILTER (
                    WHERE
                        pi.warehouse_id IS NOT NULL
                ),
                0
            )::int as total_quantity
        FROM
            packagings p
            LEFT JOIN packaging_inventory pi ON (pi.packaging_id = p.id)
            LEFT JOIN warehouses w ON (pi.warehouse_id = w.id)
            LEFT JOIN packaging_images pim ON pim.packaging_id = p.id
                AND pim.deleted_at IS NULL AND pim.is_primary = true
            LEFT JOIN files f ON f.id = pim.file_id
                AND pim.deleted_at IS NULL
        WHERE
            p.id = $1
        GROUP BY
            p.id,
            p.name,
            p.min_stock_level,
            p.unit,
            p.pcs_ctn,
            p.status,
            p.deactived_at,
            p.created_at,
            p.updated_at,
            pim.file_id,
            pim.width,
            pim.height,
            pim.is_primary,
            pim.created_at,
            f.original_name,
            f.mime_type,
            f.destination,
            f.file_name,
            f.size;
      `,
      values: [packagingId],
    };

    try {
      const { rows } = await this.fastify.query<Packaging>(queryConfig);
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new BadRequestError(
        `PackagingRepo.findById() method error: ${error}`
      );
    }
  }

  async findWarehousesByPackagingId(
    packagingId: string,
    query?: PackagingRequestType["GetWarehousesById"]["Querystring"]
  ) {
    const newTable = `
      WITH 
        warehouses AS (
          SELECT
              w.*,
              pi.quantity
          FROM
              packaging_inventory pi
              LEFT JOIN warehouses w ON (pi.warehouse_id = w.id)
          WHERE
              pi.packaging_id = $1
              AND w.status = 'ACTIVE'
              AND w.deactived_at IS NULL
        )
    `;

    const queryString = [`SELECT * FROM warehouses`];

    const values: (string | number)[] = [packagingId];
    const where: string[] = [];
    let idx = 2;

    if (query) {
      if (query.name !== undefined) {
        where.push(`name ILIKE $${idx++}::text`);
        values.push(`%${query.name.trim()}%`);
      }

      if (query.address !== undefined) {
        where.push(`address ILIKE $${idx++}::text`);
        values.push(`%${query.address.trim()}%`);
      }

      if (query.status !== undefined) {
        where.push(
          `status = $${idx++}::text`,
          query.status === "ACTIVE"
            ? "deactived_at IS NULL"
            : "deactived_at IS NOT NULL"
        );
        values.push(query.status);
      }

      if (query.created_from) {
        where.push(`created_at >= $${idx++}::timestamptz`);
        values.push(query.created_from);
      }

      if (query.created_to) {
        where.push(`created_at <= $${idx++}::timestamptz`);
        values.push(query.created_to);
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

        const limit = query?.limit ?? totalItem;
        const page = query?.page ?? 1;
        const offset = (page - 1) * limit;

        queryString.push(`LIMIT $${idx++}::int OFFSET $${idx}::int`);
        values.push(limit, offset);

        const queryConfig: QueryConfig = {
          text: [newTable, queryString.join(" ")].join(" "),
          values,
        };

        const { rows: warehouses } = await this.fastify.query<StockAt>(
          queryConfig
        );

        const totalPage = Math.ceil(totalItem / limit) || 0;

        return {
          warehouses,
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
        `PackagingRepo.findWarehousesByPackagingId() method error: ${error}`
      );
    }
  }

  async findPackagingDetailById(packagingId: string) {
    const queryConfig: QueryConfig = {
      text: `
        SELECT
            p.*,
            CASE
                WHEN pim.file_id IS NOT NULL THEN
                    json_build_object(
                        'id',
                        pim.file_id,
                        'width',
                        pim.width,
                        'height',
                        pim.height,
                        'is_primary',
                        pim.is_primary,
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
                            pim.created_at AT TIME ZONE 'UTC',
                            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                            )
                    )
                ELSE null
            END 
            AS image,
            COUNT(pi.warehouse_id) FILTER (
                WHERE
                    pi.warehouse_id IS NOT NULL
                    AND w.status = 'ACTIVE'
            )::int as warehouse_count,
            COALESCE(
                SUM(pi.quantity) FILTER (
                    WHERE
                        pi.warehouse_id IS NOT NULL
                        AND w.status = 'ACTIVE'
                ),
                0
            )::int as total_quantity,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id',
                        w.id,
                        'name',
                        w.name,
                        'address',
                        w.address,
                        'status',
                        w.status,
                        'deactived_at',
                        w.deactived_at,
                        'created_at',
                        to_char(
                            w.created_at AT TIME ZONE 'UTC',
                            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                        ),
                        'updated_at',
                        to_char(
                            w.updated_at AT TIME ZONE 'UTC',
                            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                        ),
                        'quantity',
                        pi.quantity
                    )
                ) FILTER (
                    WHERE
                        w.id IS NOT NULL
                        AND w.status = 'ACTIVE'
                ),
                '[]'
            ) AS warehouses
        FROM
            packagings p
            LEFT JOIN packaging_inventory pi ON (pi.packaging_id = p.id)
            LEFT JOIN warehouses w ON (pi.warehouse_id = w.id)
            LEFT JOIN packaging_images pim ON pim.packaging_id = p.id
                AND pim.deleted_at IS NULL AND pim.is_primary = true
            LEFT JOIN files f ON f.id = pim.file_id
                AND pim.deleted_at IS NULL
        WHERE
            p.id = $1
        GROUP BY
            p.id,
            p.name,
            p.min_stock_level,
            p.unit,
            p.pcs_ctn,
            p.status,
            p.deactived_at,
            p.created_at,
            p.updated_at,
            pim.file_id,
            pim.width,
            pim.height,
            pim.is_primary,
            pim.created_at,
            f.original_name,
            f.mime_type,
            f.destination,
            f.file_name,
            f.size;
      `,
      values: [packagingId],
    };

    try {
      const { rows } = await this.fastify.query<PackagingDetail>(queryConfig);
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new BadRequestError(
        `PackagingRepo.findPackagingDetailById() method error: ${error}`
      );
    }
  }

  async createNewPackaging(data: PackagingRequestType["Create"]["Body"]) {
    const columns: string[] = ["name", "unit"];
    const values: (string | number)[] = [data.name, data.unit];
    const placeholders: string[] = ["$1::text", "$2::text"];

    let idx = values.length;

    if (data.unit === "CARTON") {
      columns.push("pcs_ctn");
      values.push(data.pcs_ctn);
      placeholders.push(`$${++idx}::integer`);
    }

    if (data.min_stock_level !== undefined) {
      columns.push("min_stock_level");
      values.push(data.min_stock_level);
      placeholders.push(`$${++idx}::integer`);
    }

    const queryConfig: QueryConfig = {
      text: `INSERT INTO packagings (${columns.join(
        ", "
      )}) VALUES (${placeholders.join(", ")}) RETURNING *;`,
      values,
    };

    try {
      return await this.fastify.transaction(async (client) => {
        const { rows: packagings } = await client.query<Packaging>(queryConfig);

        if (data.warehouseIds && data.warehouseIds.length > 0) {
          await client.query({
            text: `INSERT INTO packaging_inventory (packaging_id, warehouse_id ) VALUES ${data.warehouseIds
              .map((_, i) => {
                return `($1, $${i + 2})`;
              })
              .join(", ")}`,
            values: [packagings[0].id, ...data.warehouseIds],
          });
        }
        return packagings[0];
      });
    } catch (error: unknown) {
      throw new BadRequestError(
        `PackagingRepo.create() method error: ${error}`
      );
    }
  }

  async updatePackagingById(
    packagingId: string,
    data: PackagingRequestType["UpdateById"]["Body"]
  ) {
    if (Object.keys(data).length === 0) return;

    try {
      await this.fastify.transaction(async (client) => {
        if (data.warehouseIds) {
          if (data.warehouseIds.length > 0) {
            // delete warehouse
            await client.query({
              text: `DELETE FROM packaging_inventory
            WHERE packaging_id = $1::text 
              AND warehouse_id NOT IN (${data.warehouseIds
                .map((_, i) => {
                  return `$${i + 2}::text`;
                })
                .join(", ")})
            RETURNING *;`,
              values: [packagingId, ...data.warehouseIds],
            });
            // insert warehouse
            await client.query({
              text: `INSERT INTO packaging_inventory (packaging_id, warehouse_id)
          VALUES ${data.warehouseIds
            .map((_, i) => `($1, $${i + 2})`)
            .join(", ")} 
          ON CONFLICT DO NOTHING;`,
              values: [packagingId, ...data.warehouseIds],
            });
          } else {
            await client.query({
              text: `DELETE FROM packaging_inventory
            WHERE packaging_id = $1::text RETURNING *;`,
              values: [packagingId],
            });
          }
        }

        let idx = 1;
        const sets: string[] = [];
        const values: (string | number | null | Date)[] = [];

        if (data.name !== undefined) {
          sets.push(`name = $${idx++}::text`);
          values.push(data.name);
        }

        if (data.unit !== undefined) {
          sets.push(`unit = $${idx++}::text`);
          values.push(data.unit);
        }

        if (data.pcs_ctn !== undefined) {
          sets.push(`pcs_ctn = $${idx++}::integer`);
          values.push(data.pcs_ctn);
        }

        if (data.min_stock_level !== undefined) {
          sets.push(`min_stock_level = $${idx++}::integer`);
          values.push(data.min_stock_level);
        }

        if (data.status !== undefined) {
          sets.push(
            `status = $${idx++}::text`,
            `deactived_at = $${idx++}::timestamptz`
          );
          values.push(
            data.status,
            data.status === "ACTIVE" ? null : new Date()
          );
        }
        values.push(packagingId);

        if (sets.length > 0) {
          const queryConfig: QueryConfig = {
            text: `UPDATE packagings SET ${sets.join(
              ", "
            )} WHERE id = $${idx} RETURNING *;`,
            values,
          };
          await client.query<Packaging>(queryConfig);
        }
      });
    } catch (error: unknown) {
      throw new BadRequestError(
        `PackagingRepo.updatePackagingById() method error: ${error}`
      );
    }
  }

  async updateImageById(id: string, file: MulterFile, userId: string) {
    try {
      await this.fastify.transaction(async (client) => {
        // thêm file mới
        const queryConfig: QueryConfig = {
          text: `
            INSERT INTO files (original_name, mime_type, destination, file_name, path, size, owner_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;      
          `,
          values: [
            file.originalname,
            file.mimetype,
            file.destination,
            file.filename,
            file.path,
            file.size,
            userId,
          ],
        };
        const { rows: files } = await client.query<FileUpload>(queryConfig);

        // xoá mềm avatar cũ
        await client.query({
          text: `
            UPDATE packaging_images
            SET deleted_at = $1::timestamptz(3), is_primary = false
            WHERE packaging_id = $2::text AND is_primary = true
          `,
          values: [new Date(), id],
        });

        // thêm avatar
        const metadata = await sharp(files[0].path).metadata();
        await client.query({
          text: `
            INSERT INTO packaging_images (packaging_id, file_id, width, height, is_primary)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
          `,
          values: [id, files[0].id, metadata.width, metadata.height, true],
        });
      });
    } catch (error) {
      deleteFile(file.path);
      throw new BadRequestError(
        `UserRepo.updateImageById() method error: ${error}`
      );
    }
  }

  async deletePackagingById(packagingId: string) {
    const queryConfig: QueryConfig = {
      text: `DELETE FROM packagings WHERE id = $1 RETURNING *;`,
      values: [packagingId],
    };
    try {
      const { rows } = await this.fastify.query<Packaging>(queryConfig);
      return rows[0] ?? null;
    } catch (error: unknown) {
      throw new BadRequestError(
        `PackagingRepo.deletePackagingById() method error: ${error}`
      );
    }
  }
}
