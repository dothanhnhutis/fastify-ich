--- count row afater GROUP BY
WITH
    grouped AS (
        SELECT
            w.*,
            count(ps.packaging_id) FILTER (
                WHERE
                    p.deleted_at IS NULL
            ) AS packaging_count
        FROM
            packaging_stocks ps
            LEFT JOIN packagings p ON (ps.packaging_id = p.id)
            LEFT JOIN warehouses w ON (ps.warehouse_id = w.id)
        GROUP BY
            w.id
    )
SELECT
    COUNT(*)::int AS total_groups
FROM
    grouped;

---
SELECT
    w.*,
    count(ps.packaging_id) FILTER (
        WHERE
            p.deleted_at IS NULL
    ) AS packaging_count
FROM
    packaging_stocks ps
    LEFT JOIN packagings p ON (ps.packaging_id = p.id)
    LEFT JOIN warehouses w ON (ps.warehouse_id = w.id)
    -- WHERE
    --     warehouse_id = '8a6a5a04-33fe-4f41-a0a0-b5da135d68c0'
WHERE
    created_at >= '2025-09-07T00:00:00Z'::timestamptz
GROUP BY
    w.id;

---
SELECT
    w.*,
    COUNT(ps.packaging_id) FILTER (
        WHERE
            p.deleted_at IS NULL
    ) AS packaging_count
FROM
    packaging_stocks ps
    LEFT JOIN packagings p ON ps.packaging_id = p.id
    LEFT JOIN warehouses w ON ps.warehouse_id = w.id
WHERE
    w.created_at >= '2025-09-06T00:00:0Z'::timestamptz
GROUP BY
    w.id;

--- get full
SELECT
    w.*,
    count(ps.packaging_id) FILTER (
        WHERE
            p.deleted_at IS NULL
    ) AS packaging_count,
    COALESCE(
        json_agg(
            json_build_object(
                'id',
                p.id,
                'name',
                p.name,
                'deleted_at',
                to_char(
                    p.created_at AT TIME ZONE 'UTC',
                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ),
                'updated_at',
                to_char(
                    p.updated_at AT TIME ZONE 'UTC',
                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ),
                'quantity',
                ps.quantity
            )
        ) FILTER (
            WHERE
                p.deleted_at IS NULL
        ),
        '[]'
    ) AS packagings
FROM
    packaging_stocks ps
    LEFT JOIN packagings p ON (ps.packaging_id = p.id)
    LEFT JOIN warehouses w ON (ps.warehouse_id = w.id)
WHERE
    warehouse_id = 'ed2e320e-d0db-4be7-8a0b-fa387f2ef045'
GROUP BY
    w.id
LIMIT
    1;