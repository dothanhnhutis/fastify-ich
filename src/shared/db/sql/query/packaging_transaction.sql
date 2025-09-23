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