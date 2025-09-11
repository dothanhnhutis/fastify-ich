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
-- CREATE TABLE IF NOT EXISTS packaging_transactions (
--     id TEXT NOT NULL DEFAULT gen_random_uuid ()::text,
--     code VARCHAR(20) UNIQUE NOT NULL,
--     type VARCHAR(20) NOT NULL,
--     from_warehouse_id TEXT NOT NULL,
--     to_warehouse_id TEXT,
--     note VARCHAR(255) NOT NULL DEFAULT '',
--     created_by INTEGER REFERENCES users (id),
--     created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
-- );
--- create index users table
CREATE UNIQUE INDEX users_email_key ON users (email);

--- AddForeignKey user_roles
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE ON UPDATE CASCADE;

--- AddForgeignKey 
ALTER TABLE packaging_inventory
ADD CONSTRAINT packaging_inventory_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE packaging_inventory
ADD CONSTRAINT packaging_inventory_packaging_id_fkey FOREIGN KEY (packaging_id) REFERENCES packagings (id) ON DELETE RESTRICT ON UPDATE CASCADE;