---
INSERT INTO
    user_roles (user_id, role_id)
VALUES
    (
        '65fbae65-76d1-413d-b804-aa177c072c38',
        'd12e2e48-5f90-4568-99c0-15e2088829a7'
    );

---
DELETE FROM user_roles
WHERE
    user_id = '65fbae65-76d1-413d-b804-aa177c072c38'
    AND role_id NOT IN ('d12e2e48-5f90-4568-99c0-15e2088829a7');

---
SELECT
from
    user_roles
WHERE
    user_id = '65fbae65-76d1-413d-b804-aa177c072c38'
    AND role_id NOT IN ('d12e2e48-5f90-4568-99c0-15e2088829a7');

--- findRolesByUserId 
WITH
    roles AS (
        SELECT
            r.*
        FROM
            user_roles ur
            LEFT JOIN roles r ON (r.id = ur.role_id)
        WHERE
            user_id = 'a68b251c-0118-45f0-a722-c6ed1562539a'
            AND r.status = 'ACTIVE'
            AND r.deactived_at IS NULL
    )
SELECT
    *
FROM
    roles