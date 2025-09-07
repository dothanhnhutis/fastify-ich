WITH
    packaging_stocks AS (
        SELECT
            p.*,
            ps.quantity
        FROM
            packaging_stocks ps
            LEFT JOIN packagings p ON (ps.packaging_id = p.id)
        WHERE
            ps.warehouse_id = '8a6a5a04-33fe-4f41-a0a0-b5da135d68c0'
    )
SELECT
    COUNT(*)
FROM
    packaging_stocks;

---