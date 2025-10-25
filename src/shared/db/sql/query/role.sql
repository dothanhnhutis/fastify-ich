--- findRoles v2
SELECT
    r.*,
    (
        SELECT COUNT(*)
        FROM user_roles ur2
        JOIN users u2 ON u2.id = ur2.user_id
        WHERE ur2.role_id = r.id
          AND u2.status = 'ACTIVE'
          AND u2.deactived_at IS NULL
    )::int AS user_count,
    COALESCE(
        json_agg(
            json_build_object(
                'id', u.id,
                'email', u.email,
                'has_password', (u.password_hash IS NOT NULL)::boolean,
                'username', u.username,
                'status', u.status,
                'deactived_at', u.deactived_at,
                'created_at', to_char(
                    u.created_at AT TIME ZONE 'UTC',
                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ),
                'updated_at', to_char(
                    u.updated_at AT TIME ZONE 'UTC',
                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ),
				'avatar', CASE WHEN av.file_id IS NOT NULL THEN 
                        json_build_object(
                            'id', av.file_id,
                            'width', av.width,
                            'height', av.height,
                            'is_primary', av.is_primary,
                            'original_name', f.original_name,
                            'mime_type', f.mime_type,
                            'destination', f.destination,
                            'file_name', f.file_name,
                            'size', f.size,
                            'created_at', to_char(
                                av.created_at AT TIME ZONE 'UTC',
                                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                            )
                        )
                    ELSE NULL END
            )
        ) FILTER (WHERE u.id IS NOT NULL),
        '[]'
    ) AS users
FROM roles r
LEFT JOIN LATERAL (
    SELECT u.*
    FROM user_roles ur
    JOIN users u ON u.id = ur.user_id
    WHERE ur.role_id = r.id
      AND u.status = 'ACTIVE'
      AND u.deactived_at IS NULL
    ORDER BY u.created_at DESC  -- bạn có thể đổi tiêu chí sắp xếp
    LIMIT 3
) u ON TRUE
LEFT JOIN user_avatars av ON av.user_id = u.id
    AND av.deleted_at IS NULL
    AND av.is_primary = true
LEFT JOIN files f ON f.id = av.file_id
    AND av.deleted_at IS NULL
GROUP BY r.id;

--- findRoles v3 
SELECT
    r.*,
    (
        SELECT COUNT(*)
        FROM user_roles ur2
        JOIN users u2 ON u2.id = ur2.user_id
        WHERE ur2.role_id = r.id
          AND u2.status = 'ACTIVE'
          AND u2.deactived_at IS NULL
    ) AS user_count,
    COALESCE(
        json_agg(
            json_build_object(
                'id', u.id,
                'email', u.email,
                'has_password', (u.password_hash IS NOT NULL)::boolean,
                'username', u.username,
                'status', u.status,
                'deactived_at', u.deactived_at,
                'created_at', to_char(
                    u.created_at AT TIME ZONE 'UTC',
                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ),
                'updated_at', to_char(
                    u.updated_at AT TIME ZONE 'UTC',
                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ),
                'avatar', av.avatar
            )
        ) FILTER (WHERE u.id IS NOT NULL),
        '[]'
    ) AS users
FROM roles r
LEFT JOIN LATERAL (
    SELECT u.*
    FROM user_roles ur
    JOIN users u ON u.id = ur.user_id
    WHERE ur.role_id = r.id
      AND u.status = 'ACTIVE'
      AND u.deactived_at IS NULL
    ORDER BY u.created_at DESC
    LIMIT 3
) u ON TRUE
LEFT JOIN LATERAL (
    SELECT json_build_object(
        'id', av.file_id,
        'width', av.width,
        'height', av.height,
        'is_primary', av.is_primary,
        'original_name', f.original_name,
        'mime_type', f.mime_type,
        'destination', f.destination,
        'file_name', f.file_name,
        'size', f.size,
        'created_at', to_char(
            av.created_at AT TIME ZONE 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
        )
    ) AS avatar
    FROM user_avatars av
    JOIN files f ON f.id = av.file_id
    WHERE av.user_id = u.id
      AND av.deleted_at IS NULL
      AND av.is_primary = TRUE
    LIMIT 1
) av ON TRUE

GROUP BY r.id;



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

--- findRoles
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

--- findRoleById
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

--- findRoleDetailById
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
                to_char(
                    u.created_at AT TIME ZONE 'UTC',
                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ),
                'updated_at',
                to_char(
                    u.updated_at AT TIME ZONE 'UTC',
                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                )
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