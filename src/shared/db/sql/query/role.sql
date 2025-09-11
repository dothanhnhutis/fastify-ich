--- create new role
INSERT INTO
    Roles (name, permissions)
VALUES
    (
        'Super Admin',
        ARRAY[
            'read:user:id',
            'read:user:*',
            'create:user',
            'update:user',
            'create:role',
            'update:role',
            'read:role:*',
            'read:role:id',
            'delete:role'
        ]
    )
RETURNING
    *;

--- query
SELECT
    r.*,
    COUNT(ur.user_id) FILTER (
        WHERE
            ur.user_id IS NOT NULL
            AND u.status = 'ACTIVE'
            AND u.deactived_at IS NULL
    )::int AS user_count
FROM
    roles r
    LEFT JOIN user_roles ur ON (ur.role_id = r.id)
    LEFT JOIN users u ON (ur.user_id = u.id)
GROUP BY
    r.id;

---
SELECT
    r.*,
    COUNT(ur.user_id) FILTER (
        WHERE
            ur.user_id IS NOT NULL
            AND u.status = 'ACTIVE'
            AND u.deactived_at IS NULL
    )::int AS user_count
FROM
    roles r
    LEFT JOIN user_roles ur ON (ur.role_id = r.id)
    LEFT JOIN users u ON (ur.user_id = u.id)
GROUP BY
    r.id;

--- findById
SELECT
    r.*,
    COUNT(ur.user_id) FILTER (
        WHERE
            ur.user_id IS NOT NULL
            AND u.status = 'ACTIVE'
            AND u.deactived_at IS NULL
    )::int AS user_count
FROM
    roles r
    LEFT JOIN user_roles ur ON (ur.role_id = r.id)
    LEFT JOIN users u ON (ur.user_id = u.id)
WHERE
    r.id = '4291b57b-557f-4b53-9f9b-13fb605a8e71'
GROUP BY
    r.id
LIMIT
    1;

--- findDetailById
SELECT
    r.*,
    COUNT(ur.user_id) FILTER (
        WHERE
            ur.user_id IS NOT NULL
            AND u.status = 'ACTIVE'
            AND u.deactived_at IS NULL
    )::int AS user_count,
    COALESCE(
        json_agg(
            json_build_object(
                'id',
                u.id,
                'email',
                u.email,
                'has_password',
                (u.password_hash IS NOT NULL)::boolean,
                'username',
                u.username,
                'status',
                u.status,
                'deactived_at',
                u.deactived_at,
                'created_at',
                u.created_at,
                'updated_at',
                u.updated_at
            )
        ) FILTER (
            WHERE
                u.id IS NOT NULL
                AND u.status = 'ACTIVE'
                AND u.deactived_at IS NULL
        ),
        '[]'
    ) AS users
FROM
    roles r
    LEFT JOIN user_roles ur ON (ur.role_id = r.id)
    LEFT JOIN users u ON (ur.user_id = u.id)
WHERE
    r.id = '4291b57b-557f-4b53-9f9b-13fb605a8e71'
GROUP BY
    r.id;

--- findUsersByRoleId
WITH
    users AS (
        SELECT
            u.id,
            u.email,
            (u.password_hash IS NOT NULL)::boolean AS has_password,
            u.username,
            u.status,
            u.deactived_at,
            u.created_at,
            u.updated_at
        FROM
            user_roles ur
            LEFT JOIN users u ON (u.id = ur.user_id)
        WHERE
            ur.role_id = '4291b57b-557f-4b53-9f9b-13fb605a8e71'
            AND u.status = 'ACTIVE'
            AND u.deactived_at IS NULL
    )
SELECT
    *
from
    users;

---
DELETE FROM user_roles
WHERE
    user_id = '12407c4b-67ca-46ac-bd91-45fe45ca3d53'
    AND role_id NOT IN ('5f31c9a7-d56f-4584-9d43-ba6295ec05d7')
RETURNING
    *;

---