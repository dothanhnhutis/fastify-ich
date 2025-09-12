--- findPackagings
SELECT
    p.*,
    COUNT(pi.warehouse_id) FILTER (
        WHERE
            pi.warehouse_id IS NOT NULL
    )::int as warehouse_count,
    SUM(pi.quantity) FILTER (
        WHERE
            pi.warehouse_id IS NOT NULL
    )::int as total_quantity
FROM
    packagings p
    LEFT JOIN packaging_inventory pi ON (pi.packaging_id = p.id)
    LEFT JOIN warehouses w ON (pi.warehouse_id = w.id)
GROUP BY
    p.id;

--- findPackagingById
SELECT
    p.*,
    COUNT(pi.warehouse_id) FILTER (
        WHERE
            pi.warehouse_id IS NOT NULL
    )::int as warehouse_count,
    SUM(pi.quantity) FILTER (
        WHERE
            pi.warehouse_id IS NOT NULL
    )::int as total_quantity
FROM
    packagings p
    LEFT JOIN packaging_inventory pi ON (pi.packaging_id = p.id)
    LEFT JOIN warehouses w ON (pi.warehouse_id = w.id)
WHERE
    p.id = 'c1bc57d6-c812-465b-9ca3-f6fd3830353d'
GROUP BY
    p.id;

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
    COUNT(pi.warehouse_id) FILTER (
        WHERE
            pi.warehouse_id IS NOT NULL
            AND w.status = 'ACTIVE'
    )::int as warehouse_count,
    SUM(pi.quantity) FILTER (
        WHERE
            pi.warehouse_id IS NOT NULL
            AND w.status = 'ACTIVE'
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
                w.created_at,
                'updated_at',
                w.updated_at,
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
WHERE
    p.id = '565b92d2-9048-42ec-8b13-f80b472b642c'
GROUP BY
    p.id;

---
INSERT INTO
    packagings (name, min_stock_level, unit, pcs_ctn)
VALUES
    ('packaging 1', 5, 'carton', 250),
    ('packaging 2', 1000, 'item', null)
RETURNING
    *;

--- 
SELECT
    p.*,
    SUM(ps.quantity)::int AS quantity
FROM
    packagings p
    LEFT JOIN packaging_stocks ps ON (p.id = ps.packaging_id)
WHERE
    p.created_at >= '2025-09-06T00:00:00.000Z'::timestamptz
GROUP BY
    p.id;

--- 
SELECT
    p.*,
    SUM(ps.quantity)::int AS total_quantity,
    COALESCE(
        json_agg(
            json_build_object(
                'id',
                w.id,
                'name',
                w.name,
                'address',
                w.address,
                'quantity',
                ps.quantity,
                'deleted_at',
                to_char(
                    w.deleted_at AT TIME ZONE 'UTC',
                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ),
                'created_at',
                to_char(
                    w.created_at AT TIME ZONE 'UTC',
                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ),
                'updated_at',
                to_char(
                    w.updated_at AT TIME ZONE 'UTC',
                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                )
            )
        ),
        '[]'
    ) as warehouses
FROM
    packagings p
    LEFT JOIN packaging_stocks ps ON (p.id = ps.packaging_id)
    LEFT JOIN warehouses w ON (w.id = ps.warehouse_id)
WHERE
    p.id = 'b4bdb315-18c5-44a7-b110-16779e4934b5'
GROUP BY
    p.id;