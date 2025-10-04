--- findPackagings
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
    f.size

--- findPackagingById
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
    p.id = 'c1bc57d6-c812-465b-9ca3-f6fd3830353d'
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
    f.size


--- findWarehousesByPackagingId
SELECT
    w.*,
    pi.quantity
FROM
    packaging_inventory pi
    LEFT JOIN warehouses w ON (pi.warehouse_id = w.id)
WHERE
    pi.packaging_id = 'c1bc57d6-c812-465b-9ca3-f6fd3830353d'
    AND w.status = 'ACTIVE'
    AND w.deactived_at IS NULL;

--- findPackagingDetailById
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
    p.id = '0199acec-f92c-79b5-b8c5-62d2195fedbb'
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

--- createnewPackaging
INSERT INTO
    packagings (name, min_stock_level, unit, pcs_ctn)
VALUES
    ('packaging 1', 5, 'carton', 250),
    ('packaging 2', 1000, 'item', null)
RETURNING
    *;

---deletePackagingById
DELETE FROM packagings
WHERE
    id = 'a42a0458-844e-4a71-a169-f09f20513359';