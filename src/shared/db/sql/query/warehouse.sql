BEGIN;

INSERT INTO
    warehouses (name, address)
VALUES
    (
        'Nha May ICH',
        '159 Nguyen Dinh chieu, khom 3, phuong 4, TP. Soc Trang'
    ),
    (
        'Nha Kho',
        '102 Nguyen Dinh chieu, khom 3, phuong 4, TP. Soc Trang'
    ) RETURNING *;

COMMIT;

ROLLBACK;