--- findPackagings
SELECT
    p.*,
    COUNT(pi.warehouse_id) FILTER (
        WHERE
            pi.warehouse_id IS NOT NULL
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
GROUP BY
    p.id;

--- findPackagingById
SELECT
    p.*,
    COUNT(pi.warehouse_id) FILTER (
        WHERE
            pi.warehouse_id IS NOT NULL
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