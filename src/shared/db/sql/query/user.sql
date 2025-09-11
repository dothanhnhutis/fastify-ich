---- chèn bằng file
-- cách 1: chèm full field
COPY users
FROM
    'user_data.csv' DELIMITER ',' CSV;

--- cách 2: chèm có chọn field email, password_hash, username
COPY users (email, password_hash, username)
FROM
    '/data/user.csv'
WITH
    (FORMAT csv, HEADER true, DELIMITER ',');

--- Cập nhật userByEmail
UPDATE users
SET
    password_hash = '$argon2id$v=19$m=65536,t=3,p=4$oDdsbvL66JBFGcGtpM2bVQ$BSuYE86W6ALjeRJmC9I5sv/pr6xXJj3eFGvgS+aF7Io',
    username = 'new name'
WHERE
    email = 'gaconght@gmail.com'
RETURNING
    *;

--- Chèn thủ công
INSERT INTO
    users (email, username, password_hash)
VALUES
    (
        'gaconght@gmail.com',
        'thanh nhut',
        '$argon2id$v=19$m=65536,t=3,p=4$oDdsbvL66JBFGcGtpM2bVQ$BSuYE86W6ALjeRJmC9I5sv/pr6xXJj3eFGvgS+aF7Io'
    )
RETURNING
    *;

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

END;

--- findByEmail without password
SELECT
    id,
    email,
    (password_hash IS NOT NULL)::boolean AS has_password,
    username,
    status,
    deactived_at,
    created_at,
    updated_at
FROM
    users
WHERE
    email = 'example@gmail.com'
LIMIT
    1;

--- findById  without password
SELECT
    id,
    email,
    (password_hash IS NOT NULL)::boolean AS has_password,
    username,
    status,
    deactived_at,
    created_at,
    updated_at
FROM
    users_without_password
WHERE
    id = 'a68b251c-0118-45f0-a722-c6ed1562539a'
LIMIT
    1;

--- findUserRoleById
SELECT
    u.id,
    email,
    (u.password_hash IS NOT NULL)::boolean AS has_password,
    username,
    status,
    u.deactived_at,
    u.created_at,
    u.updated_at,
    COUNT(ur.role_id) AS role_count
FROM
    users u
    LEfT JOIN user_roles ur ON (ur.user_id = u.id)
WHERE
    id = 'd7d2b394-7604-4f93-9011-a5c45727dee1'
GROUP BY
    u.id
LIMIT
    1;

--- findUserRoleDetailById
SELECT
    u.id,
    email,
    (u.password_hash IS NOT NULL)::boolean AS has_password,
    username,
    u.status,
    u.deactived_at,
    u.created_at,
    u.updated_at,
    COUNT(ur.role_id) FILTER (
        WHERE
            r.id IS NOT NULL
            AND r.status = 'ACTIVE'
    )::int AS role_count,
    COALESCE(
        json_agg(
            json_build_object(
                'id',
                r.id,
                'name',
                r.name,
                'permissions',
                r.permissions,
                'description',
                r.description,
                'status',
                r.status,
                'deactived_at',
                r.deactived_at,
                'created_at',
                r.created_at,
                'updated_at',
                r.updated_at
            )
        ) FILTER (
            WHERE
                r.id IS NOT NULL
                AND r.status = 'ACTIVE'
        ),
        '[]'
    ) AS roles
FROM
    users u
    LEFT JOIN user_roles ur ON (ur.user_id = u.id)
    LEFT JOIN roles r ON (ur.role_id = r.id)
WHERE
    u.id = 'd7d2b394-7604-4f93-9011-a5c45727dee1'
GROUP BY
    u.id
LIMIT
    1;

--- findUserPasswordById
SELECT
    *
FROM
    users_without_password
WHERE
    id = 'a68b251c-0118-45f0-a722-c6ed1562539a'
LIMIT
    1;

--- findUserDetailById
SELECT
    u.id,
    u.email,
    (u.password_hash IS NOT NULL)::boolean AS has_password,
    u.username,
    u.status,
    u.deactived_at,
    u.created_at,
    u.updated_at,
    COUNT(ur.role_id) FILTER (
        WHERE
            r.id IS NOT NULL
            AND r.status = 'ACTIVE'
    ) AS role_count,
    COALESCE(
        json_agg(
            json_build_object(
                'id',
                r.id,
                'name',
                r.name,
                'permissions',
                r.permissions,
                'description',
                r.description,
                'status',
                r.status,
                'deactived_at',
                r.deactived_at,
                'created_at',
                r.created_at,
                'updated_at',
                r.updated_at
            )
        ) FILTER (
            WHERE
                r.id IS NOT NULL
                AND r.status = 'ACTIVE'
        ),
        '[]'
    ) AS roles
FROM
    users u
    LEFT JOIN user_roles ur ON (ur.user_id = u.id)
    LEFT JOIN roles r ON (ur.role_id = r.id)
GROUP BY
    u.id;

--- query
SELECT
    u.id,
    u.email,
    (u.password_hash IS NOT NULL)::boolean AS has_password,
    u.username,
    u.status,
    u.deactived_at,
    u.created_at,
    u.updated_at,
    COUNT(ur.role_id) FILTER (
        WHERE
            r.id IS NOT NULL
            AND r.status = 'ACTIVE'
    ) AS role_count
FROM
    users u
    LEFT JOIN user_roles ur ON (ur.user_id = u.id)
    LEFT JOIN roles r ON (ur.role_id = r.id)
GROUP BY
    u.id;

--- findRolesByUserId
WITH
    roles AS (
        SELECT
            r.*
        FROM
            user_roles ur
            LEFT JOIN roles r ON (r.id = ur.role_id)
        WHERE
            user_id = 'd7d2b394-7604-4f93-9011-a5c45727dee1'
            AND r.status = 'ACTIVE'
            AND r.deactived_at IS NULL
    )
SELECT
    *
FROM
    roles
WHERE
    permissions @> ARRAY['read:user:*'];