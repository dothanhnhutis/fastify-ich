--- 
SELECT
    p.*,
    SUM(ps.quantity) AS quantity
FROM
    packagings p
    LEFT JOIN packaging_stocks ps ON (p.id = ps.packaging_id)
    -- WHERE
    --     id = 'ee59b063-acac-47a0-9a96-cc14bf7816b5';
GROUP BY
    p.id;

---
SELECT
    p.*,
    SUM(ps.quantity) AS total,
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