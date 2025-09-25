--- Tạo tài khoản user và role với transaction
BEGIN;

WITH
    inserted_user AS (
        INSERT INTO
            users (email, username, password_hash)
        VALUES
            (
                'gaconght@gmail.com',
                'Thanh Nhut',
                '$argon2id$v=19$m=65536,t=3,p=4$oDdsbvL66JBFGcGtpM2bVQ$BSuYE86W6ALjeRJmC9I5sv/pr6xXJj3eFGvgS+aF7Io'
            )
        RETURNING
            id
    ),
    inserted_role AS (
        INSERT INTO
            roles (name, permissions, description)
        VALUES
            (
                'Super Admin',
                ARRAY[
                    'read:user:*',
                    'read:user:id',
                    'create:user',
                    'update:user',
                    'delete:user',
                    'read:role:*',
                    'read:role:id',
                    'create:role',
                    'update:role',
                    'delete:role'
                ],
                'Vai tro manh nhat trong he thong'
            )
        RETURNING
            id
    )
INSERT INTO
    user_roles (user_id, role_id)
SELECT
    u.id,
    r.id
FROM
    inserted_user u,
    inserted_role r;

COMMIT;

--- Create packaging and warehouse
BEGIN;

WITH
    new_packaging AS (
        INSERT INTO
            packagings (name, min_stock_level, unit, pcs_ctn)
        VALUES
            ('packaging 1', 5, 'CARTON', 250),
            ('packaging 2', 1000, 'PIECE', null)
        RETURNING
            id
    ),
    new_warehouse AS (
        INSERT INTO
            warehouses (name, address)
        VALUES
            ('Nha kho 1', '159 Nguyen Dinh Chieu'),
            ('Nha kho 2', '102 Nguyen Dinh Chieu')
        RETURNING
            id
    )
INSERT INTO
    packaging_inventory (packaging_id, warehouse_id)
SELECT
    p.id,
    w.id
FROM
    new_packaging p,
    new_warehouse w;

COMMIT;

--- create packaging transaction
BEGIN;

WITH
    new_packaging_transaction AS (
        INSERT INTO
            packaging_transactions (
                type,
                from_warehouse_id,
                note,
                transaction_date,
                status
            )
        VALUES
            (
                'EXPORT',
                '9c21c29c-342b-47fa-afb9-4c84eea87bec',
                'xuất kho, kiểm tra trigger',
                NOW(),
                'CREATED'
            )
        RETURNING
            id
    )
INSERT INTO
    packaging_transaction_items (
        packaging_transaction_id,
        packaging_id,
        warehouse_id,
        quantity,
        signed_quantity
    )
SELECT
    new_packaging_transaction.id,
    x.packaging_id,
    x.warehouse_id,
    x.quantity,
    x.signed_quantity
FROM
    new_packaging_transaction
    CROSS JOIN (
        VALUES
            (
                '0d8c5ca8-639e-473c-b42f-d5edc51c33e6',
                '9c21c29c-342b-47fa-afb9-4c84eea87bec',
                100,
                -100
            ),
            (
                'fa660c2a-4772-4982-8a2e-d4c0e01c197b',
                '9c21c29c-342b-47fa-afb9-4c84eea87bec',
                100,
                -100
            )
    ) AS x (
        packaging_id,
        warehouse_id,
        quantity,
        signed_quantity
    );

COMMIT;

WITH
    ins AS (
        INSERT INTO
            packaging_inventory (packaging_id, warehouse_id, quantity,)
        VALUES
            (
                '383b9359-f1c9-41ca-bfbe-7cfdb2054440',
                '30693f77-c6c2-4087-be7a-b76a9e9141ae',
                0
            )
        ON CONFLICT (packaging_id, warehouse_id) DO NOTHING
        RETURNING
            *
    )
SELECT
    *
FROM
    ins
UNION ALL
SELECT
    *
FROM
    packaging_inventory
WHERE
    packaging_id = '383b9359-f1c9-41ca-bfbe-7cfdb2054440'
    AND warehouse_id = '30693f77-c6c2-4087-be7a-b76a9e9141ae'
LIMIT
    1;

-- Create New packaging Transaction
BEGIN;

WITH
    new_packaging_transaction as (
        INSERT INTO
            packaging_transactions (
                type,
                from_warehouse_id,
                note,
                transaction_date,
                status
            )
        VALUES
            (
                'IMPORT',
                '178e0c52-0639-4d8a-877f-6ab5beebc7d4',
                'nhap hang',
                '2025-09-19T04:13:59Z',
                'CREATED'
            )
        RETURNING
            id
    )
INSERT INTO
    packaging_transaction_items (
        packaging_transaction_id,
        packaging_id,
        warehouse_id,
        quantity,
        signed_quantity
    )
SELECT
    *
FROM
COMMIT;

INSERT INTO
    packaging_transactions (
        type,
        from_warehouse_id,
        note,
        transaction_date,
        status
    )
VALUES
    (
        'IMPORT',
        '178e0c52-0639-4d8a-877f-6ab5beebc7d4',
        'nhap hang',
        '2025-09-19T04:13:59Z',
        'CREATED'
    )
RETURNING
    id;