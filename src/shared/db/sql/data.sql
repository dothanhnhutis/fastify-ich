


--- Add Role for User
INSERT INTO user_roles (user_id, role_id)
VALUES (
        '09a2d9aa-2981-4fcf-8084-9704ab5043c4',
        'fdec3bd0-5753-4c16-9917-41fcf182eeb3'
    ),
    (
        '09a2d9aa-2981-4fcf-8084-9704ab5043c4',
        'fdec3bd0-5753-4c16-9917-41fcf182eeb3'
    );
--- Find Roles of User
SELECT *
FROM roles
WHERE id IN (
        SELECT role_id
        FROM user_roles
        WHERE user_id = '09a2d9aa-2981-4fcf-8084-9704ab5043c4'
    );
---
DELETE FROM roles
WHERE id = '50cffaeb-1b75-4834-a18c-189b85f9c276';
---
DROP TABLE IF EXISTS packaging_transactions;
---
DROP TYPE IF EXISTS transaction_type ---
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_id_fkey;
---
DELETE FROM roles
WHERE id not IN (
        '2ec09bf8-e9fb-4e6f-88cc-07ca69602610',
        '30217f60-dd5b-4ad9-a1a8-696fe7fde502'
    );
---
SELECT *
FROM roles
WHERE permissions = ALL('read:warehouse:*') -- WHERE name ILIKE '%Manager update%';
    ---
SELECT *
FROM roles
ORDER BY permissions DESC,
    name ASC
LIMIT 1 OFFSET 1;
---
SELECT *
FROM roles
WHERE permissions @> ARRAY ['read:warehouse:*', 'read:role:*'];
---
SELECT *
FROM roles ---
INSERT INTO warehouses(name, address)
VALUES('Nha Kho', '159 nguyen dinh chieu')
RETURNING *;
---
INSERT INTO packagings(name)
VALUES('Hop giay B')
RETURNING *;
---
INSERT INTO packaging_stocks(warehouse_id, packaging_id)
VALUES (
        '32a56069-c637-4084-b053-ebee4c6ea42c',
        'a4bb912b-9e69-4477-86aa-c1600058fc78'
    )
RETURNING *;
-- 4bdb6f0b-d5af-42c4-8d9a-f7b50bd7fbc1
SET "audit.user" = "09095ad4-fb22-4e24-b209-0d8e6c47064f";
INSERT INTO packaging_transactions (type, note)
VALUES (
        'IMPORT'::transaction_type,
        'nhap kho san pham A'
    )
RETURNING *;
----
---
INSERT INTO packaging_transaction_items (
        packaging_stock_id,
        packaging_transaction_id,
        quantity,
        signed_quantity
    )
VALUES (
        '70c26509-ab56-4c47-bcce-154a692b2d83',
        '49c083c5-b280-4803-829c-e3e500fcf4db',
        50,
        50
    )
RETURNING *;
---
INSERT INTO packaging_transaction_audits (
        packaging_transaction_id,
        action_type,
        new_data,
        performed_at,
        performed_by
    )
VALUES(
        '49c083c5-b280-4803-829c-e3e500fcf4db',
        "CREATE",
    );
---
SELECT *
FROM packagings;
---
SELECT packaging_id,
    sum(quantity)
FROM packaging_stocks
GROUP BY packaging_id;
---
SELECT p.*,
    sum(ps.quantity),
    COALESCE(
        json_agg(ps) FILTER (
            WHERE ps.warehouse_id IS NOT NULL
        ),
        '[]'
    ) AS items
FROM packagings p
    LEFT JOIN packaging_stocks ps ON p.id = ps.packaging_id -- WHERE p.id = 'a4bb912b-9e69-4477-86aa-c1600058fc78'
GROUP BY p.id
LIMIT 1;
---
SELECT p.*,
    sum(ps.quantity),
    COALESCE(
        json_agg(
            json_build_object(
                'id',
                ps.id,
                'warehouse_id',
                ps.warehouse_id,
                'packaging_id',
                ps.packaging_id,
                'quantity',
                ps.quantity,
                'warehouse',
                row_to_json(w),
                'created_at',
                ps.created_at,
                'updated_at',
                ps.updated_at
            )
        ) FILTER (
            WHERE ps.warehouse_id IS NOT NULL
        ),
        '[]'
    ) AS items
FROM packagings p
    LEFT JOIN packaging_stocks ps ON p.id = ps.packaging_id
    LEFT JOIN warehouses w ON ps.warehouse_id = w.id
WHERE p.id = 'a4bb912b-9e69-4477-86aa-c1600058fc78'
GROUP BY p.id;
---
UPDATE packaging_stocks
SET quantity = (
        SELECT sum(signed_quantity)
        FROM packaging_transaction_items
        WHERE packaging_stock_id = 'aac02c2b-f611-448c-884d-1e6946cec664'
    )
WHERE id = 'aac02c2b-f611-448c-884d-1e6946cec664'
RETURNING *;