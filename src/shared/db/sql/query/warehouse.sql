--- findWarehouses
SELECT
    w.*,
    COUNT(pi.packaging_id) FILTER (
        WHERE
            pi.packaging_id IS NOT NULL
            AND p.status = 'ACTIVE'
    ) AS packaging_count
FROM
    warehouses w
    LEFT JOIN packaging_inventory pi ON (pi.warehouse_id = w.id)
    LEFT JOIN packagings p ON (pi.packaging_id = p.id)
WHERE
    id = '0676db90-178b-4d24-8c2a-4db4a198ab82'
GROUP BY
    w.id;

--- findWarehouseById
SELECT
    w.*,
    COUNT(pi.packaging_id) FILTER (
        WHERE
            pi.packaging_id IS NOT NULL
            AND p.status = 'ACTIVE'
    ) AS packaging_count
FROM
    warehouses w
    LEFT JOIN packaging_inventory pi ON (pi.warehouse_id = w.id)
    LEFT JOIN packagings p ON (pi.packaging_id = p.id)
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
    pi.warehouse_id = '0676db90-178b-4d24-8c2a-4db4a198ab82'
    AND p.status = 'ACTIVE'
    AND p.deactived_at IS NULL;

--- findWarehouseDetailById
SELECT
    w.*,
    COUNT(pi.packaging_id) FILTER (
        WHERE
            pi.packaging_id IS NOT NULL
            AND p.status = 'ACTIVE'
    ) AS packaging_count,
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
                p.created_at,
                'updated_at',
                p.updated_at,
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
    packagings p
    LEFT JOIN packaging_inventory pi ON (pi.packaging_id = p.id)
    LEFT JOIN warehouses w ON (pi.warehouse_id = w.id)
GROUP BY
    w.id;