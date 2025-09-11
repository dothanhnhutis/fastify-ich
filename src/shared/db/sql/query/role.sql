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

--- findById
SELECT
    r.*,
    COUNT(ur.user_id)::int as user_count
FROM
    roles r
    LEFT JOIN user_roles ur ON (ur.role_id = r.id)
WHERE
    id = '4291b57b-557f-4b53-9f9b-13fb605a8e71'
GROUP BY
    r.id
LIMIT
    1;

--- findUsersByRoleId
---
DELETE FROM user_roles
WHERE
    user_id = '12407c4b-67ca-46ac-bd91-45fe45ca3d53'
    AND role_id NOT IN ('5f31c9a7-d56f-4584-9d43-ba6295ec05d7')
RETURNING
    *;

---