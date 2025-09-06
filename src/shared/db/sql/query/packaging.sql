-- SELECT SUM(ps.quantity), COALESCE(json_agg(json_build_object('id',ps.)), '[]')  AS items
SELECT
    p.*,
    SUM(ps.quantity) as total,
    COALESCE(
        json_agg(json_build_object('quantity', ps.quantity)) FILTER (
            WHERE
                ps.warehouse_id IS NOT NULL
        ),
        '[]'
    ) AS items
FROM
    packagings p
    LEFT JOIN packaging_stocks ps ON p.id = ps.packaging_id
    LEFT JOIN warehouses w ON ps.warehouse_id = w.id
WHERE
    p.id = 'ee59b063-acac-47a0-9a96-cc14bf7816b5'
GROUP BY
    p.id
LIMIT
    1;