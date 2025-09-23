--- findWarehouses
SELECT
    w.*,
    COUNT(pi.packaging_id) FILTER (
        WHERE
            pi.packaging_id IS NOT NULL
            AND p.status = 'ACTIVE'
    )::int AS packaging_count
FROM
    warehouses w
    LEFT JOIN packaging_inventory pi ON (pi.warehouse_id = w.id)
    LEFT JOIN packagings p ON (pi.packaging_id = p.id)
GROUP BY
    w.id;

--- findWarehouseById
SELECT
    w.*,
    COUNT(pi.packaging_id) FILTER (
        WHERE
            pi.packaging_id IS NOT NULL
            AND p.status = 'ACTIVE'
    )::int AS packaging_count
FROM
    warehouses w
    LEFT JOIN packaging_inventory pi ON (pi.warehouse_id = w.id)
    LEFT JOIN packagings p ON (pi.packaging_id = p.id)
WHERE
    w.id = '9c21c29c-342b-47fa-afb9-4c84eea87bec'
GROUP BY
    w.id;

--- findPackagingsByWarehouseId
SELECT
    p.*,
    pi.quantity
FROM
    packaging_inventory pi
    LEFT JOIN packagings p ON (pi.packaging_id = p.id)
WHERE
    pi.warehouse_id = '9c21c29c-342b-47fa-afb9-4c84eea87bec'
    AND p.status = 'ACTIVE'
    AND p.deactived_at IS NULL;

--- findWarehouseDetailById
SELECT
    w.*,
    COUNT(pi.packaging_id) FILTER (
        WHERE
            pi.packaging_id IS NOT NULL
            AND p.status = 'ACTIVE'
    )::int AS packaging_count,
    COALESCE(
        json_agg(
            json_build_object(
                'id',
                p.id,
                'name',
                p.name,
                'min_stock_level',
                p.min_stock_level,
                'unit',
                p.unit,
                'pcs_ctn',
                p.pcs_ctn,
                'status',
                p.status,
                'deactived_at',
                p.deactived_at,
                'created_at',
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
                pi.quantity
            )
        ) FILTER (
            WHERE
                p.id IS NOT NULL
                AND p.status = 'ACTIVE'
        ),
        '[]'
    ) AS packagings
FROM
    warehouses w
    LEFT JOIN packaging_inventory pi ON (pi.warehouse_id = w.id)
    LEFT JOIN packagings p ON (pi.packaging_id = p.id)
WHERE
    w.id = '16c6660a-44e4-47a2-bc51-d2d25555024f'
GROUP BY
    w.id;