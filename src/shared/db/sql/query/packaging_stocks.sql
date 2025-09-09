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
WITH
    packaging_stocks AS (
        SELECT
            w.*,
            (ps.quantity) AS quantity
        FROM
            packaging_stocks ps
            LEFT JOIN warehouses w ON (ps.warehouse_id = w.id)
        WHERE
            ps.packaging_id = '96d29ca5-615c-420a-bfc8-e42ee1be86a3'
    )
SELECT
    *
FROM
    packaging_stocks;