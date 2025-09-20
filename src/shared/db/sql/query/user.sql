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

--- findUserWithoutPasswordByEmail
SELECT
    u.id,
    u.email,
    (u.password_hash IS NOT NULL)::boolean AS has_password,
    u.username,
    u.status,
    u.deactived_at,
    u.created_at,
    u.updated_at,
    COUNT(r.id) FILTER (
        WHERE
            r.id IS NOT NULL
            AND r.status = 'ACTIVE'
    )::int AS role_count,
    json_build_object(
        'id',
        av.file_id,
        'width',
        av.width,
        'height',
        av.height,
        'is_primary',
        av.is_primary,
        'original_name',
        f.original_name,
        'mime_type',
        f.mime_type,
        'destination',
        f.destination,
        'file_name',
        f.file_name,
        'size',
        f.size,
        'created_at',
        to_char(
            av.created_at AT TIME ZONE 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
        )
    ) AS avatar
FROM
    users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON ur.role_id = r.id
    LEFT JOIN user_avatars av ON av.user_id = u.id
    AND av.deleted_at IS NULL
    AND av.is_primary = true
    LEFT JOIN files f ON f.id = av.file_id
    AND f.deleted_at IS NULL
WHERE
    u.email = 'gaconght@gmail.com'
GROUP BY
    u.id,
    u.email,
    u.password_hash,
    u.username,
    u.status,
    u.deactived_at,
    u.created_at,
    u.updated_at,
    av.file_id,
    av.width,
    av.height,
    av.is_primary,
    av.created_at,
    f.original_name,
    f.mime_type,
    f.destination,
    f.file_name,
    f.size
LIMIT
    1;

--- findUserWithoutPasswordById
SELECT
    u.id,
    u.email,
    (u.password_hash IS NOT NULL)::boolean AS has_password,
    u.username,
    u.status,
    u.deactived_at,
    u.created_at,
    u.updated_at,
    COUNT(r.id) FILTER (
        WHERE
            r.id IS NOT NULL
            AND r.status = 'ACTIVE'
    )::int AS role_count,
    json_build_object(
        'id',
        av.file_id,
        'width',
        av.width,
        'height',
        av.height,
        'is_primary',
        av.is_primary,
        'original_name',
        f.original_name,
        'mime_type',
        f.mime_type,
        'destination',
        f.destination,
        'file_name',
        f.file_name,
        'size',
        f.size,
        'created_at',
        to_char(
            av.created_at AT TIME ZONE 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
        )
    ) AS avatar
FROM
    users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON ur.role_id = r.id
    LEFT JOIN user_avatars av ON av.user_id = u.id
    AND av.deleted_at IS NULL
    AND av.is_primary = true
    LEFT JOIN files f ON f.id = av.file_id
    AND f.deleted_at IS NULL
WHERE
    u.id = '2b6d8104-c4d1-41af-a1a5-2600f2a7a676'
GROUP BY
    u.id,
    u.email,
    u.password_hash,
    u.username,
    u.status,
    u.deactived_at,
    u.created_at,
    u.updated_at,
    av.file_id,
    av.width,
    av.height,
    av.is_primary,
    av.created_at,
    f.original_name,
    f.mime_type,
    f.destination,
    f.file_name,
    f.size
LIMIT
    1;

-- findUserById
SELECT
    u.*,
    COUNT(r.id) FILTER (
        WHERE
            r.id IS NOT NULL
            AND r.status = 'ACTIVE'
    )::int AS role_count,
    json_build_object(
        'id',
        av.file_id,
        'width',
        av.width,
        'height',
        av.height,
        'is_primary',
        av.is_primary,
        'original_name',
        f.original_name,
        'mime_type',
        f.mime_type,
        'destination',
        f.destination,
        'file_name',
        f.file_name,
        'size',
        f.size,
        'created_at',
        to_char(
            av.created_at AT TIME ZONE 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
        )
    ) AS avatar
FROM
    users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON ur.role_id = r.id
    LEFT JOIN user_avatars av ON av.user_id = u.id
    AND av.deleted_at IS NULL
    AND av.is_primary = true
    LEFT JOIN files f ON f.id = av.file_id
    AND f.deleted_at IS NULL
WHERE
    u.id = '2b6d8104-c4d1-41af-a1a5-2600f2a7a676'
GROUP BY
    u.id,
    u.email,
    u.password_hash,
    u.username,
    u.status,
    u.deactived_at,
    u.created_at,
    u.updated_at,
    av.file_id,
    av.width,
    av.height,
    av.is_primary,
    av.created_at,
    f.original_name,
    f.mime_type,
    f.destination,
    f.file_name,
    f.size
LIMIT
    1;

-- findUserByEmail
SELECT
    u.*,
    COUNT(r.id) FILTER (
        WHERE
            r.id IS NOT NULL
            AND r.status = 'ACTIVE'
    )::int AS role_count,
    json_build_object(
        'id',
        av.file_id,
        'width',
        av.width,
        'height',
        av.height,
        'is_primary',
        av.is_primary,
        'original_name',
        f.original_name,
        'mime_type',
        f.mime_type,
        'destination',
        f.destination,
        'file_name',
        f.file_name,
        'size',
        f.size,
        'created_at',
        to_char(
            av.created_at AT TIME ZONE 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
        )
    ) AS avatar
FROM
    users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON ur.role_id = r.id
    LEFT JOIN user_avatars av ON av.user_id = u.id
    AND av.deleted_at IS NULL
    AND av.is_primary = true
    LEFT JOIN files f ON f.id = av.file_id
    AND f.deleted_at IS NULL
WHERE
    u.email = 'gaconght@gmail.com'
GROUP BY
    u.id,
    u.email,
    u.password_hash,
    u.username,
    u.status,
    u.deactived_at,
    u.created_at,
    u.updated_at,
    av.file_id,
    av.width,
    av.height,
    av.is_primary,
    av.created_at,
    f.original_name,
    f.mime_type,
    f.destination,
    f.file_name,
    f.size
LIMIT
    1;

-- findUserDetailById
SELECT
    u.*,
    COUNT(r.id) FILTER (
        WHERE
            r.id IS NOT NULL
            AND r.status = 'ACTIVE'
    )::int AS role_count,
    json_build_object(
        'id',
        av.file_id,
        'width',
        av.width,
        'height',
        av.height,
        'is_primary',
        av.is_primary,
        'original_name',
        f.original_name,
        'mime_type',
        f.mime_type,
        'destination',
        f.destination,
        'file_name',
        f.file_name,
        'size',
        f.size,
        'created_at',
        to_char(
            av.created_at AT TIME ZONE 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
        )
    ) AS avatar,
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
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON ur.role_id = r.id
    LEFT JOIN user_avatars av ON av.user_id = u.id
    AND av.deleted_at IS NULL
    AND av.is_primary = true
    LEFT JOIN files f ON f.id = av.file_id
    AND f.deleted_at IS NULL
WHERE
    u.id = '2b6d8104-c4d1-41af-a1a5-2600f2a7a676'
GROUP BY
    u.id,
    u.email,
    u.password_hash,
    u.username,
    u.status,
    u.deactived_at,
    u.created_at,
    u.updated_at,
    av.file_id,
    av.width,
    av.height,
    av.is_primary,
    av.created_at,
    f.original_name,
    f.mime_type,
    f.destination,
    f.file_name,
    f.size
LIMIT
    1;

-- findRolesByUserId
WITH
    roles AS (
        SELECT
            r.*
        FROM
            user_roles ur
            LEFT JOIN roles r ON (r.id = ur.role_id)
        WHERE
            user_id = '2b6d8104-c4d1-41af-a1a5-2600f2a7a676'
            AND r.status = 'ACTIVE'
            AND r.deactived_at IS NULL
    )
SELECT
    *
FROM
    roles
WHERE
    permissions @> ARRAY['read:user:*'];

-- findUsers
SELECT
    u.id,
    u.email,
    (u.password_hash IS NOT NULL)::boolean AS has_password,
    u.username,
    u.status,
    u.deactived_at,
    u.created_at,
    u.updated_at,
    COUNT(r.id) FILTER (
        WHERE
            r.id IS NOT NULL
            AND r.status = 'ACTIVE'
    )::int AS role_count,
    json_build_object(
        'id',
        av.file_id,
        'width',
        av.width,
        'height',
        av.height,
        'is_primary',
        av.is_primary,
        'original_name',
        f.original_name,
        'mime_type',
        f.mime_type,
        'destination',
        f.destination,
        'file_name',
        f.file_name,
        'size',
        f.size,
        'created_at',
        av.created_at
    ) AS avatar
FROM
    users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON ur.role_id = r.id
    LEFT JOIN user_avatars av ON av.user_id = u.id
    AND av.deleted_at IS NULL
    AND av.is_primary = true
    LEFT JOIN files f ON f.id = av.file_id
    AND f.deleted_at IS NULL
GROUP BY
    u.id,
    u.email,
    u.password_hash,
    u.username,
    u.status,
    u.deactived_at,
    u.created_at,
    u.updated_at,
    av.file_id,
    av.width,
    av.height,
    av.is_primary,
    f.original_name,
    f.mime_type,
    f.destination,
    f.file_name,
    f.size;