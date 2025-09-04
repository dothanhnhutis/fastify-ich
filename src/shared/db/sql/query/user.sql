---- chèn bằng file
-- cách 1: chèm full trường
COPY users
FROM 'user_data.csv' DELIMITER ',' CSV;
--- cách 2: chèm có chọn field email, password_hash, username
COPY users (email, password_hash, username)
FROM '/data/user.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');
-- Xoá bảng
DROP TABLE IF EXISTS "PackagingTransaction";
---
UPDATE users
SET password_hash = '$argon2id$v=19$m=65536,t=3,p=4$oDdsbvL66JBFGcGtpM2bVQ$BSuYE86W6ALjeRJmC9I5sv/pr6xXJj3eFGvgS+aF7Io',
    username = 'new name'
WHERE email = 'gaconght@gmail.com'
RETURNING *;
---
INSERT INTO users (email, username, password_hash)
VALUES (
        'gaconght@gmail.com',
        'thanh nhut',
        '$argon2id$v=19$m=65536,t=3,p=4$oDdsbvL66JBFGcGtpM2bVQ$BSuYE86W6ALjeRJmC9I5sv/pr6xXJj3eFGvgS+aF7Io'
    )
RETURNING *;
---
SELECT *
FROM users;
---
DELETE FROM user_roles
WHERE user_id = '9af45a98-df32-48ae-bfec-22b7bd339875';
---
DELETE FROM users
WHERE id = '9af45a98-df32-48ae-bfec-22b7bd339875';
---
INSERT INTO user_roles (user_id, role_id)
VALUES (
        '65fbae65-76d1-413d-b804-aa177c072c38',
        'd12e2e48-5f90-4568-99c0-15e2088829a7'
    );
---
DELETE FROM user_roles
WHERE user_id = '65fbae65-76d1-413d-b804-aa177c072c38'
    AND role_id NOT IN ('d12e2e48-5f90-4568-99c0-15e2088829a7');
---
SELECT
from user_roles
WHERE user_id = '65fbae65-76d1-413d-b804-aa177c072c38'
    AND role_id NOT IN ('d12e2e48-5f90-4568-99c0-15e2088829a7');
--- create admin account
BEGIN;
WITH inserted_user AS (
    INSERT INTO users (email, username, password_hash)
    VALUES (
            'gaconght1@gmail.com',
            'Thanh Nhut',
            '$argon2id$v=19$m=65536,t=3,p=4$oDdsbvL66JBFGcGtpM2bVQ$BSuYE86W6ALjeRJmC9I5sv/pr6xXJj3eFGvgS+aF7Io'
        )
    RETURNING id
),
inserted_role AS (
    INSERT INTO roles (name, permissions, description)
    VALUES (
            'Super Admin',
            ARRAY [
                'read:user:*',
                'read:user:id',
                'create:user' ,
                'update:user',
                'delete:user',
                'read:role:*',
                'read:role:id',
                'create:role' ,
                'update:role',
                'delete:role'
                ],
            'Vai tro manh nhat trong he thong'
        )
    RETURNING id
)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id,
    r.id
FROM inserted_user u,
    inserted_role r;
COMMIT;