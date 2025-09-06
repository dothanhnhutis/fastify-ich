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
    warehouse_id = 'dc9f16f5-abec-4102-9da2-46b2e725a803'
GROUP BY
    w.id
LIMIT
    1;

SELECT
    *
from
    packaging_stocks;

--- query
SELECT
    w.*,
    COUNT(w.id) as count
FROM
    warehouses w
    LEFT JOIN packaging_stocks ps ON (w.id = ps.warehouse_id)
WHERE
    name ILIKE '%Nhà %'
GROUP BY
    w.id;