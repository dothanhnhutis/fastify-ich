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
            roles (name, permissions, description, canDelete, canUpdate)
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
                'Vai tro manh nhat trong he thong',
                false,
                false
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

