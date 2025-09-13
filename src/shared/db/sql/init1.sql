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
    id TEXT NOT NULL DEFAULT gen_random_uuid ()::text,
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
    id TEXT NOT NULL DEFAULT gen_random_uuid ()::text,
    name TEXT NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    description TEXT NOT NULL DEFAULT '',
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    deactived_at TIMESTAMPTZ(3),
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
    id TEXT NOT NULL DEFAULT gen_random_uuid ()::text,
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
    id TEXT NOT NULL DEFAULT gen_random_uuid ()::text,
    name VARCHAR(255) NOT NULL,
    min_stock_level INTEGER,
    unit VARCHAR(20) NOT NULL,
    pcs_ctn INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    deactived_at TIMESTAMPTZ(3),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT packagings_pkey PRIMARY KEY (id)
);

--- create packaging_inventory
CREATE TABLE IF NOT EXISTS packaging_inventory (
    packaging_id TEXT NOT NULL,
    warehouse_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT packaging_inventory_pkey PRIMARY KEY (warehouse_id, packaging_id)
);

--- create packaging_transactions
CREATE TABLE IF NOT EXISTS packaging_transactions (
    id TEXT NOT NULL DEFAULT gen_random_uuid ()::text,
    code VARCHAR(20) UNIQUE NOT NULL, -- mã phiếu: IMP001, EXP001, ADJ001, TRF001
    type VARCHAR(20) NOT NULL, -- IMPORT, EXPORT, ADJUST, TRANSFER
    from_warehouse_id TEXT NOT NULL,
    to_warehouse_id TEXT,
    note VARCHAR(255) NOT NULL DEFAULT '',
    transaction_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'CREATED', -- CREATED, COMPLETED, CANCELLED
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT packaging_transactions_pkey PRIMARY KEY (id)
);

--- create packaging_transactions_items 
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

-- ALTER TABLE packaging_transaction_items
-- ADD CONSTRAINT packaging_transaction_items_pkey PRIMARY KEY (
--     packaging_transaction_id,
--     warehouse_id,
--     packaging_id
-- );
--- create index users table
CREATE UNIQUE INDEX users_email_key ON users (email);

--- AddForeignKey user_roles
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE;

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

--- func set_updated_at
CREATE OR REPLACE FUNCTION set_updated_at () RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; 
$$;

--- func check_quantity_before_delete
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


CREATE OR REPLACE FUNCTION function_name(type VARCHAR(20), transaction_date DATE, ...)
RETURNS VARCHAR(50)
AS $$
DECLARE
    code VARCHAR(50);
BEGIN
    CASE type
        WHEN 'IMPORT' THEN prefix := 'IMP';
        WHEN 'EXPORT' THEN prefix := 'EXP';
        WHEN 'ADJUST' THEN prefix := 'ADJ';
        WHEN 'TRANSFER' THEN prefix := 'TRF';
        ELSE prefix := 'STK';
    END CASE;

    sequence_name := 'seq_' || prefix || '_' || EXTRACT(YEAR FROM transaction_date);



    RETURN code;
END;
$$ LANGUAGE plpgsql;


CREATE SEQUENCE IF NOT EXISTS seq_imp_2025 START 1;
SELECT nextval('seq_imp_2025');
SELECT to_regclass('seq_imp_2026');


-- Function để tự động tạo mã phiếu
CREATE OR REPLACE FUNCTION generate_transaction_code () RETURNS TRIGGER AS $$
DECLARE
    prefix VARCHAR(10);
    sequence_name VARCHAR(50);
    next_number INTEGER;
BEGIN
    -- Xác định prefix theo loại phiếu
    CASE NEW.type
        WHEN 'IMPORT' THEN prefix := 'IMP';
        WHEN 'EXPORT' THEN prefix := 'EXP';
        WHEN 'ADJUST' THEN prefix := 'ADJ';
        WHEN 'TRANSFER' THEN prefix := 'TRF';
        ELSE prefix := 'STK';
    END CASE;
    
    -- Tạo sequence name
    sequence_name := 'seq_' || prefix || '_' || EXTRACT(YEAR FROM NEW.transaction_date);
    
    -- Tạo sequence nếu chưa tồn tại
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1', sequence_name);
    
    -- Lấy số tiếp theo
    EXECUTE format('SELECT nextval(%L)', sequence_name) INTO next_number;
    
    -- Tạo mã phiếu: PREFIX + YYYY + 6 số
    NEW.code := prefix || EXTRACT(YEAR FROM NEW.transaction_date) || LPAD(next_number::TEXT, 6, '0');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- DROP TRIGGER IF EXISTS trg_updated_at_users ON users;
-- DROP TRIGGER IF EXISTS trg_updated_at_roles ON roles;
-- DROP TRIGGER IF EXISTS check_unit_pcs_ctn_after_update ON packagings;
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

--- trigger kiểm quantity phải bằng 0 trước khi xoá
CREATE TRIGGER trg_updated_at_packagings BEFORE DELETE ON packagings FOR EACH ROW
EXECUTE FUNCTION check_quantity_before_delete ();

--- trigger kiểm tra tính hợp lệ giữa unit và pcs_ctn
CREATE TRIGGER trg_check_unit_pcs_ctn_validate BEFORE INSERT
OR
UPDATE ON packagings FOR EACH ROW
EXECUTE FUNCTION check_unit_pcs_ctn_validate ();

--- trigger tự động tạo mã phiếu
CREATE TRIGGER generate_stock_transaction_code BEFORE INSERT ON packaging_transactions FOR EACH ROW WHEN (
    NEW.code IS NULL
    OR NEW.code = ''
)
EXECUTE FUNCTION generate_transaction_code ();