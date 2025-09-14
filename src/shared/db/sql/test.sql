DROP FUNCTION IF EXISTS update_packaging_inventory;

CREATE OR REPLACE FUNCTION update_packaging_inventory () RETURNS TRIGGER AS $$
BEGIN
    -- Khi status chuyển sang COMPLETED (hoàn tất)
    IF NEW.status = 'COMPLETED' AND OLD.status <> 'COMPLETED' THEN
        -- Cập nhật tồn kho
        UPDATE packaging_inventory pi
        SET 
            quantity = pi.quantity + pti.signed_quantity,
            available_quantity = pi.available_quantity + pti.signed_quantity,
            updated_at = NOW()
        FROM packaging_transaction_items pti
        WHERE pti.packaging_transaction_id = NEW.id
          AND pi.packaging_id = pti.packaging_id
          AND pi.warehouse_id = pti.warehouse_id;

        -- Thêm record tồn kho nếu chưa có
        -- INSERT INTO packaging_inventory (
        --     packaging_id,
        --     warehouse_id,
        --     quantity,
        --     reserved_quantity,
        --     available_quantity,
        --     created_at,
        --     updated_at
        -- )
        -- SELECT 
        --     pti.packaging_id,
        --     pti.warehouse_id,
        --     pti.signed_quantity,
        --     0,
        --     pti.signed_quantity,
        --     NOW(),
        --     NOW()
        -- FROM packaging_transaction_items pti
        -- WHERE pti.packaging_transaction_id = NEW.id
        --   AND NOT EXISTS (
        --       SELECT 1 
        --       FROM packaging_inventory pi
        --       WHERE pi.packaging_id = pti.packaging_id
        --         AND pi.warehouse_id = pti.warehouse_id
        --   );
    END IF;

    -- Khi status chuyển từ COMPLETED sang CANCELLED (rollback)
    IF OLD.status = 'COMPLETED' AND NEW.status = 'CANCELLED' THEN
        UPDATE packaging_inventory pi
        SET 
            quantity = quantity - pti.signed_quantity,
            available_quantity = available_quantity - pti.signed_quantity,
            updated_at = NOW()
        FROM packaging_transaction_items pti
        WHERE pti.packaging_transaction_id = OLD.id
          AND pi.packaging_id = pti.packaging_id
          AND pi.warehouse_id = pti.warehouse_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trg_update_inventory_after_transaction_completed ON packaging_transactions;

CREATE TRIGGER trg_update_inventory_after_transaction_completed
AFTER
UPDATE ON packaging_transactions FOR EACH ROW
EXECUTE FUNCTION update_packaging_inventory ();

UPDATE packaging_transactions
set
    status = 'COMPLETED'
where
    id = 'fbf13cef-1d3e-4b77-81b8-05d4b85a9eda'
returning
    *;

--- create 
BEGIN;

WITH
    new_packaging_transaction AS (
        INSERT INTO
            packaging_transactions (
                code,
                type,
                from_warehouse_id,
                note,
                transaction_date,
                status
            )
        VALUES
            (
                'EXP2025000001',
                'EXPORT',
                '0676db90-178b-4d24-8c2a-4db4a198ab82',
                'xuất kho, kiểm tra trigger',
                '2025-09-14',
                'DRAFT' -- bạn ghi nhầm "DRAF"
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
    new_packaging_transaction.id,
    x.packaging_id,
    x.warehouse_id,
    x.quantity,
    x.signed_quantity
FROM
    new_packaging_transaction
    CROSS JOIN (
        VALUES
            (
                '0f2175cd-e4f6-4353-ac9e-d549c3af8641',
                '0676db90-178b-4d24-8c2a-4db4a198ab82',
                100,
                -100
            ),
            (
                'f6b7261a-2902-40fe-8831-51999929df56',
                '0676db90-178b-4d24-8c2a-4db4a198ab82',
                100,
                -100
            )
    ) AS x (
        packaging_id,
        warehouse_id,
        quantity,
        signed_quantity
    );

COMMIT;

CREATE OR REPLACE FUNCTION log_packaging_transaction_audit () RETURNS TRIGGER AS $$
DECLARE action TEXT;
changed_data JSONB;
performed_by TEXT;
 -- Lấy user từ session (nếu chưa set sẽ là NULL)
BEGIN
performed_by := current_setting('app.user', true);
-- Xác định loại hành động
IF TG_OP = 'INSERT' THEN action := 'CREATE'::action_type;
changed_data := to_jsonb(NEW);
ELSIF TG_OP = 'UPDATE' THEN action := 'UPDATE'::action_type;
changed_data := jsonb_build_object(
    'old',
    to_jsonb(OLD),
    'new',
    to_jsonb(NEW)
);
ELSIF TG_OP = 'DELETE' THEN action := 'DELETE'::action_type;
changed_data := to_jsonb(OLD);
END IF;
-- Ghi log
INSERT INTO packaging_transaction_audits (
        packaging_transaction_id,
        actionType,
        changedData,
        performedBy
    )
VALUES (
        COALESCE(NEW.id, OLD.id),
        action,
        changed_data,
        COALESCE(performed_by, 'unknown')
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--
DROP FUNCTION if EXISTS log_packaging_transaction_audit ();

DROP TRIGGER trg_packaging_transaction_audit ON packaging_transactions;

create Trigger
CREATE TRIGGER trg_packaging_transaction_audit
AFTER INSERT
OR
UPDATE
OR DELETE ON packaging_transactions FOR EACH ROW
EXECUTE FUNCTION log_packaging_transaction_audit ();

----
DROP FUNCTION gen_code;

CREATE OR REPLACE FUNCTION gen_code (type VARCHAR(20), transaction_date DATE) RETURNS VARCHAR(50) AS $$
DECLARE
    prefix         VARCHAR(10);
    sequence_name  TEXT;
    next_number    BIGINT;
    sequence_exists BOOLEAN;
BEGIN
    -- Xác định prefix
    CASE type
        WHEN 'IMPORT'   THEN prefix := 'IMP';
        WHEN 'EXPORT'   THEN prefix := 'EXP';
        WHEN 'ADJUST'   THEN prefix := 'ADJ';
        WHEN 'TRANSFER' THEN prefix := 'TRF';
        ELSE prefix := 'STK';
    END CASE;
    -- Tạo tên sequence: seq_IMP_2025
    sequence_name := 'seq_' || prefix || '_' || EXTRACT(YEAR FROM transaction_date);
    -- Kiểm tra sequence có tồn tại hay không
    SELECT (to_regclass(sequence_name) IS NOT NULL) INTO sequence_exists;
    -- Nếu chưa có thì tạo mới
    IF NOT sequence_exists THEN
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1;', sequence_name);
        -- (OPTIONAL) ở đây bạn có thể thêm code drop sequence năm cũ, 
        -- ví dụ: DROP SEQUENCE IF EXISTS seq_IMP_2024;
    END IF;
    -- Lấy số tiếp theo
    EXECUTE format('SELECT nextval(%L);', sequence_name) INTO next_number;
    -- Trả về prefix + năm + số 6 chữ số
    RETURN prefix 
           || EXTRACT(YEAR FROM transaction_date)::TEXT 
           || LPAD(next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

SELECT
    gen_code ('IMPORT', DATE '2025-09-13');

CREATE SEQUENCE IF NOT EXISTS seq_imp_2025 START 1;

SELECT
    nextval('seq_imp_2025');

SELECT
    to_regclass('seq_imp_2025');

DROP SEQUENCE seq_imp_2025;