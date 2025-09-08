WITH
    packaging_stocks AS (
        SELECT
            p.*,
            ps.quantity
        FROM
            packaging_stocks ps
            LEFT JOIN packagings p ON (ps.packaging_id = p.id)
        WHERE
            ps.warehouse_id = '2d4d3ce0-96fc-4083-a2ce-14fb0cb14e46'
    )
SELECT
    *
FROM
    packaging_stocks
ORDER BY
    name ASC;

---