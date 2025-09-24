WITH
    ins AS (
        INSERT INTO
            packaging_inventory (packaging_id, warehouse_id, quantity,)
        VALUES
            (
                '383b9359-f1c9-41ca-bfbe-7cfdb2054440',
                '30693f77-c6c2-4087-be7a-b76a9e9141ae',
                0
            )
        ON CONFLICT (packaging_id, warehouse_id) DO NOTHING
        RETURNING
            *
    )
SELECT
    *
FROM
    ins
UNION ALL
SELECT
    *
FROM
    packaging_inventory
WHERE
    packaging_id = '383b9359-f1c9-41ca-bfbe-7cfdb2054440'
    AND warehouse_id = '30693f77-c6c2-4087-be7a-b76a9e9141ae'
LIMIT
    1;

-- Create New packaging Transaction
BEGIN;

WITH
    new_packaging_transaction as (
        INSERT INTO
            packaging_transactions (
                type,
                from_warehouse_id,
                note,
                transaction_date,
                status
            )
        VALUES
            (
                'IMPORT',
                '178e0c52-0639-4d8a-877f-6ab5beebc7d4',
                'nhap hang',
                '2025-09-19T04:13:59Z',
                'CREATED'
            )
        RETURNING
            id
    )
INSERT INTO
    packaging_transaction_items (
        packaging_transaction_id,
        packaging_id,
        warehouse_id,
        quantity,
        signed_quantity
    )
SELECT
    *
FROM
COMMIT;

INSERT INTO
    packaging_transactions (
        type,
        from_warehouse_id,
        note,
        transaction_date,
        status
    )
VALUES
    (
        'IMPORT',
        '178e0c52-0639-4d8a-877f-6ab5beebc7d4',
        'nhap hang',
        '2025-09-19T04:13:59Z',
        'CREATED'
    )
RETURNING
    id;