INSERT INTO Roles (name, permissions)
VALUES (
        'Super Admin',
        ARRAY ['read:user:id', 'read:user:*', 'create:user', 'update:user', 'create:role', 'update:role', 'read:role:*', 'read:role:id','delete:role']
    )
RETURNING *;
--- Find all Role
SELECT *
FROM roles;