INSERT INTO Roles (name, permissions)
VALUES (
        'Super Admin',
        ARRAY ['read:user:id', 'read:user:*', 'create:user', 'update:user', 'create:role', 'update:role', 'read:role:*', 'read:role:id','delete:role']
    )
RETURNING *;
--- Find all Role
SELECT *
FROM user_roles;
---
DELETE user_roles
WHERE user_id = '12407c4b-67ca-46ac-bd91-45fe45ca3d53'
    AND role_id NOT IN ('5f31c9a7-d56f-4584-9d43-ba6295ec05d7')
RETURNING *;
---