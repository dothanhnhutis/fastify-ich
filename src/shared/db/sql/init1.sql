DROP SCHEMA PUBLIC CASCADE;

CREATE SCHEMA PUBLIC;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER DATABASE pgdb
SET
    datestyle = 'ISO, DMY';

ALTER DATABASE pgdb
SET
    timezone = 'UTC';

--- timezone → ảnh hưởng đến giờ (lưu, hiển thị, convert). Có thể ép toàn DB về UTC.
--- datestyle → chỉ ảnh hưởng đến cách Postgres parse/hiển thị ngày (thứ tự ngày/tháng/năm). Nó không thay đổi dữ liệu bên trong.
-------
---- Các dạng datestyle hay gặp
----- ISO: chuẩn ISO-8601, hiển thị YYYY-MM-DD (rõ ràng, ít nhầm nhất).
----- MDY: tháng-ngày-năm (kiểu Mỹ).
----- DMY: ngày-tháng-năm (kiểu Châu Âu, VN quen dùng).
----- YMD: năm-tháng-ngày (ít khi xài vì ISO đã bao phủ).
-------
--- datestyle có thể có 1 hoặc 2 giá trị
---- 1 giá trị: chỉ định kiểu hiển thị (output format)
----- Ex: SET datestyle = 'ISO'; Hiển thị theo chuẩn ISO (YYYY-MM-DD)
---- 2 giá trị: giá trị đầu tiên là kiểu hiển thị, giá trị thứ hai là thứ tự khi parse input không rõ ràng.
----- Ex: SET datestyle = 'ISO, DMY';
----- ISO → in ra kiểu YYYY-MM-DD.
----- DMY → nếu bạn nhập '09-08-2025', PostgreSQL sẽ hiểu là 9 Aug 2025, không phải 8 Sep 2025.
---------------------------------
--- create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT NOT NULL DEFAULT uuidv7()::text,
    email VARCHAR(150) NOT NULL,
    password_hash TEXT NOT NULL,
    username VARCHAR(100) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    deactived_at TIMESTAMPTZ(3),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

--- create roles table
CREATE TABLE IF NOT EXISTS roles (
    id TEXT NOT NULL DEFAULT uuidv7()::text,
    name VARCHAR(255) NOT NULL,
    permissions VARCHAR(150)[] NOT NULL DEFAULT ARRAY[]::text[],
    description TEXT NOT NULL DEFAULT '',
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    deactived_at TIMESTAMPTZ(3),
    canDelete BOOLEAN NOT NULL DEFAULT TRUE,
    canUpdate BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);

--- create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id)
);

--- create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id TEXT NOT NULL DEFAULT uuidv7()::text,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    deactived_at TIMESTAMPTZ(3),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT warehouses_pkey PRIMARY KEY (id)
);

--- create packagings table
CREATE TABLE IF NOT EXISTS packagings (
    id TEXT NOT NULL DEFAULT uuidv7()::text,
    name VARCHAR(255) NOT NULL,
    min_stock_level INTEGER,
    unit VARCHAR(20) NOT NULL, -- PIECE | CARTON
    pcs_ctn INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    deactived_at TIMESTAMPTZ(3),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT packagings_pkey PRIMARY KEY (id)
);

--- create packaging_inventory table
CREATE TABLE IF NOT EXISTS packaging_inventory (
    packaging_id TEXT NOT NULL,
    warehouse_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    -- reserved_quantity INTEGER NOT NULL DEFAULT 0,
    -- available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT packaging_inventory_pkey PRIMARY KEY (warehouse_id, packaging_id)
);

--- create packaging_transactions table
CREATE TABLE IF NOT EXISTS packaging_transactions (
    id TEXT NOT NULL DEFAULT uuidv7()::text,
    type VARCHAR(20) NOT NULL, -- IMPORT, EXPORT, ADJUST, TRANSFER
    from_warehouse_id TEXT NOT NULL,
    to_warehouse_id TEXT,
    note VARCHAR(255) NOT NULL DEFAULT '',
    transaction_date TIMESTAMPTZ(3) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAF', -- DRAF, CREATED, COMPLETED, CANCELLED
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT packaging_transactions_pkey PRIMARY KEY (id)
    -- CHECK đảm bảo logic type <-> to_warehouse_id
    -- CONSTRAINT chk_transfer_to_warehouse
    --     CHECK (
    --         (type = 'TRANSFER' AND to_warehouse_id IS NOT NULL)
    --         OR (type <> 'TRANSFER' AND to_warehouse_id IS NULL)
    --     )
);

--- create packaging_transactions_items table 
CREATE TABLE IF NOT EXISTS packaging_transaction_items (
    packaging_transaction_id TEXT NOT NULL,
    packaging_id TEXT NOT NULL,
    warehouse_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    signed_quantity INTEGER NOT NULL,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT packaging_transaction_items_pkey PRIMARY KEY (
        packaging_transaction_id,
        warehouse_id,
        packaging_id
    )
);

---create user_avatars table
CREATE TABLE IF NOT EXISTS user_avatars (
    id TEXT NOT NULL DEFAULT uuidv7()::text,
    user_id TEXT NOT NULL,
    file_id TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    -- is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ(3),
    CONSTRAINT user_avatars_pkey PRIMARY KEY (id)
);

--- create files table
CREATE TABLE IF NOT EXISTS files (
    id TEXT NOT NULL DEFAULT uuidv7()::text,
    original_name TEXT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    destination TEXT NOT NULL,
    file_name TEXT NOT NULL,
    path TEXT NOT NULL,
    size BIGINT NOT NULL,
    -- category_id TEXT,
    owner_id TEXT NOT NULL,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    -- deleted_at TIMESTAMPTZ(3),
    CONSTRAINT files_pkey PRIMARY KEY (id)
);

-- Bảng phân loại file (tùy chọn)
-- CREATE TABLE IF NOT EXISTS file_categories (
--     id TEXT NOT NULL DEFAULT uuidv7()::text,
--     name TEXT NOT NULL,
--     description TEXT NOT NULL DEFAULT '',
--     allowed_mime_types VARCHAR(255) [], -- Array các mime type được phép
--     max_file_size BIGINT, -- Kích thước tối đa (bytes)
--     created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
--     CONSTRAINT file_categories_pkey PRIMARY KEY (id),
--     CONSTRAINT file_categories_name_unique UNIQUE (name)
-- );

-- Indexes cho performance
CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files (owner_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files (created_at);
CREATE INDEX IF NOT EXISTS idx_files_mime_type ON files (mime_type);

-- CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON files (deleted_at)
-- WHERE
--     deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_avatars_user_id ON user_avatars (user_id);
CREATE INDEX IF NOT EXISTS idx_user_avatars_deleted_at ON user_avatars (deleted_at)
WHERE
    deleted_at IS NULL;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_user_avatars_primary_unique ON user_avatars (user_id)
-- WHERE
--     is_primary = true
--     AND deleted_at IS NULL;

--- create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users (email);


--- AddForeignKey user_roles
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_users_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE ON UPDATE CASCADE;

--- AddForgeignKey packaging_inventory
ALTER TABLE packaging_inventory
ADD CONSTRAINT packaging_inventory_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE packaging_inventory
ADD CONSTRAINT packaging_inventory_packaging_id_fkey FOREIGN KEY (packaging_id) REFERENCES packagings (id) ON DELETE RESTRICT ON UPDATE CASCADE;

--- AddForgeignKey packaging_transaction_items
ALTER TABLE packaging_transaction_items
ADD CONSTRAINT packaging_transaction_items_packaging_transaction_id_fkey FOREIGN KEY (packaging_transaction_id) REFERENCES packaging_transactions (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE packaging_transaction_items
ADD CONSTRAINT packaging_transaction_items_packaging_id_fkey FOREIGN KEY (packaging_id) REFERENCES packagings (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE packaging_transaction_items
ADD CONSTRAINT packaging_transaction_items_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForgeignKey user_avatars 
ALTER TABLE user_avatars
ADD CONSTRAINT user_avatars_file_fkey FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE;

-- AddForgeignKey files 
-- ALTER TABLE files
-- ADD CONSTRAINT files_category_id_fkey FOREIGN KEY (category_id) REFERENCES file_categories (id);

-- check đảm bảo logic unit <-> pcs_ctn
ALTER TABLE packagings
ADD CONSTRAINT chk_unit_to_pcs_ctn CHECK (
    (
        unit = 'CARTON'
        AND pcs_ctn IS NOT NULL
    )
    OR (
        unit <> 'CARTON'
        AND pcs_ctn IS NULL
    )
);

-- check đảm bảo logic type <-> to_warehouse_id
ALTER TABLE packaging_transactions
ADD CONSTRAINT chk_transfer_to_warehouse CHECK (
    (
        type = 'TRANSFER'
        AND to_warehouse_id IS NOT NULL
    )
    OR (
        type <> 'TRANSFER'
        AND to_warehouse_id IS NULL
    )
);

--- func set_updated_at
CREATE OR REPLACE FUNCTION set_updated_at () RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; 
$$;

--- func đảm bảo logic unit <-> pcs_ctn
-- nếu unit != CARTON thì auto set pcs_ctn = NULL
CREATE OR REPLACE FUNCTION enforce_pcs_ctn_null () RETURNS TRIGGER AS $$
BEGIN
    IF NEW.unit <> 'CARTON' THEN
        NEW.pcs_ctn := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- func đảm bảo logic type <-> to_warehouse_id
-- nếu type != TRANSFER thì auto set to_warehouse_id = NULL
CREATE OR REPLACE FUNCTION enforce_to_warehouse_null () RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type <> 'TRANSFER' THEN
        NEW.to_warehouse_id := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--- trigger tự động cập nhật updated_at
CREATE TRIGGER trg_updated_at_users BEFORE
UPDATE ON users FOR EACH ROW
EXECUTE FUNCTION set_updated_at ();

CREATE TRIGGER trg_updated_at_roles BEFORE
UPDATE ON roles FOR EACH ROW
EXECUTE FUNCTION set_updated_at ();

CREATE TRIGGER trg_updated_at_packagings BEFORE
UPDATE ON packagings FOR EACH ROW
EXECUTE FUNCTION set_updated_at ();

CREATE TRIGGER trg_updated_at_warehouses BEFORE
UPDATE ON warehouses FOR EACH ROW
EXECUTE FUNCTION set_updated_at ();

CREATE TRIGGER trg_updated_at_packaging_inventory BEFORE
UPDATE ON packaging_inventory FOR EACH ROW
EXECUTE FUNCTION set_updated_at ();

CREATE TRIGGER trg_updated_at_packaging_transactions BEFORE
UPDATE ON packaging_transactions FOR EACH ROW
EXECUTE FUNCTION set_updated_at ();

CREATE TRIGGER trg_updated_at_packaging_transaction_items BEFORE
UPDATE ON packaging_transaction_items FOR EACH ROW
EXECUTE FUNCTION set_updated_at ();

-- trigger nếu type != CARTON thì auto set pcs_ctn = NULL
CREATE TRIGGER trg_set_pcs_ctn_null BEFORE INSERT
OR
UPDATE ON packagings FOR EACH ROW
EXECUTE FUNCTION enforce_pcs_ctn_null ();

-- trigger nếu type != TRANSFER thì auto set to_warehouse_id = NULL
CREATE TRIGGER trg_set_to_warehouse_null BEFORE INSERT
OR
UPDATE ON packaging_transactions FOR EACH ROW
EXECUTE FUNCTION enforce_to_warehouse_null ();

------------------------- đoan duoi xem xét lại trước khi sử dụng----------------------------------
--- func check_quantity_before_delete
-- bỏ
CREATE OR REPLACE FUNCTION check_quantity_before_delete () RETURNS TRIGGER AS $$
BEGIN 
    IF OLD.quantity > 0 THEN 
        RAISE EXCEPTION 'Không thể xoá vì quantity = % (phải bằng 0)', OLD.quantity;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- DROP FUNCTION IF EXISTS check_unit_pcs_ctn_after_update;
--- func check_unit_pcs_ctn_validate
CREATE OR REPLACE FUNCTION check_unit_pcs_ctn_validate () RETURNS TRIGGER AS $$
BEGIN
    IF NEW.unit = 'CARTON' AND (NEW.pcs_ctn IS NULL OR NEW.pcs_ctn = 0) THEN
        RAISE EXCEPTION 'Không thể % khi unit = CARTON và pcs_ctn = %', TG_OP, NEW.pcs_ctn;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--- func update_packaging_inventory
-- bỏ
CREATE OR REPLACE FUNCTION update_packaging_inventory () RETURNS TRIGGER AS $$
BEGIN
    -- Khi status chuyển sang COMPLETED (hoàn tất)
    IF NEW.status = 'COMPLETED' AND OLD.status <> 'COMPLETED' THEN
        -- Cập nhật tồn kho
        UPDATE packaging_inventory pi
        SET 
            quantity = pi.quantity + pti.signed_quantity,
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
            quantity = pi.quantity - pti.signed_quantity,
            updated_at = NOW()
        FROM packaging_transaction_items pti
        WHERE pti.packaging_transaction_id = OLD.id
          AND pi.packaging_id = pti.packaging_id
          AND pi.warehouse_id = pti.warehouse_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- DROP TRIGGER IF EXISTS trg_updated_at_users ON users;
-- DROP TRIGGER IF EXISTS trg_updated_at_roles ON roles;
-- DROP TRIGGER IF EXISTS check_unit_pcs_ctn_after_update ON packagings;
--- trigger tự động cập nhật updated_at
--- trigger kiểm quantity phải bằng 0 trước khi xoá
CREATE TRIGGER trg_updated_at_packagings BEFORE DELETE ON packagings FOR EACH ROW
EXECUTE FUNCTION check_quantity_before_delete ();

--- trigger kiểm tra tính hợp lệ giữa unit và pcs_ctn
CREATE TRIGGER trg_check_unit_pcs_ctn_validate BEFORE INSERT
OR
UPDATE ON packagings FOR EACH ROW
EXECUTE FUNCTION check_unit_pcs_ctn_validate ();

-- Trigger cập nhật lại packaging_inventory khi có transaction
-- DROP TRIGGER IF EXISTS trg_update_inventory_after_transaction_completed ON packaging_transactions;
CREATE TRIGGER trg_update_inventory_after_transaction_completed
AFTER
UPDATE ON packaging_transactions FOR EACH ROW
EXECUTE FUNCTION update_packaging_inventory ();