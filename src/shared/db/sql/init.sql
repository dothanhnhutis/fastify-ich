-- config database
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER DATABASE pgdb
SET
    datestyle = 'ISO, MDY';
-- SET TIMEZONE = 'UTC';
--- tạo biến local cho connection hiện tại
-- SET "audit.user" = 'Người_A';
-- SELECT current_setting('audit.user', true);
-- CreateTable
CREATE TABLE IF NOT EXISTS users (
    id text NOT NULL DEFAULT gen_random_uuid ()::text,
    email text NOT NULL,
    password_hash text NOT NULL,
    username text NOT NULL,
    disabled_at timestamptz(3),
    created_at timestamptz(3) NOT NULL DEFAULT NOW(),
    updated_at timestamptz(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

---
-- ALTER TABLE users
-- ADD COLUMN disabled_at TIMESTAMPTZ(3);
-- CreateTable
CREATE TABLE IF NOT EXISTS roles (
    id text NOT NULL DEFAULT gen_random_uuid ()::text,
    NAME text NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    description text NOT NULL DEFAULT '',
    created_at timestamptz(3) NOT NULL DEFAULT NOW(),
    updated_at timestamptz(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);

-- CreateTable
CREATE TABLE IF NOT EXISTS user_roles (
    user_id text NOT NULL,
    role_id text NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id)
);

-- CreateTable
CREATE TABLE IF NOT EXISTS warehouses (
    id text NOT NULL DEFAULT gen_random_uuid ()::text,
    NAME text NOT NULL,
    address text NOT NULL,
    deleted_at timestamptz(3),
    created_at timestamptz(3) NOT NULL DEFAULT NOW(),
    updated_at timestamptz(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT warehouses_pkey PRIMARY KEY (id)
);

-- CreateTable
CREATE TABLE IF NOT EXISTS packagings (
    id text NOT NULL DEFAULT gen_random_uuid ()::text,
    NAME text NOT NULL,
    deleted_at timestamptz(3),
    created_at timestamptz(3) NOT NULL DEFAULT NOW(),
    updated_at timestamptz(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT packagings_pkey PRIMARY KEY (id)
);

-- CreateTable
CREATE TABLE IF NOT EXISTS packaging_stocks (
    -- id text NOT NULL DEFAULT gen_random_uuid ()::text,
    warehouse_id text NOT NULL,
    packaging_id text NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at timestamptz(3) NOT NULL DEFAULT NOW(),
    updated_at timestamptz(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT packaging_stocks_pkey PRIMARY KEY (warehouse_id, packaging_id)
);

-- ALTER TABLE packaging_stocks DROP COLUMN id;
-- ALTER TABLE packaging_stocks ADD PRIMARY KEY (warehouse_id, packaging_id);
-- CreateEnum
CREATE TYPE transaction_type AS enum('IMPORT', 'EXPORT', 'ADJUST');

--- CreateTable
CREATE TABLE IF NOT EXISTS packaging_transactions (
    id text NOT NULL DEFAULT gen_random_uuid ()::text,
    TYPE transaction_type NOT NULL,
    note text NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT NOW(),
    updated_at timestamptz(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT packaging_transactions_pkey PRIMARY KEY (id)
);

--- CreateTable
CREATE TABLE IF NOT EXISTS packaging_transaction_items (
    packaging_stock_id text NOT NULL,
    packaging_transaction_id text NOT NULL,
    quantity INTEGER NOT NULL,
    signed_quantity INTEGER NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT NOW(),
    updated_at timestamptz(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT packaging_transaction_items_pkey PRIMARY KEY (packaging_stock_id, packaging_transaction_id)
);

--- CreateEnum
CREATE TYPE action_type AS enum('CREATE', 'UPDATE', 'DELETE');

--- CreateTable
CREATE TABLE IF NOT EXISTS packaging_transaction_audits (
    id text NOT NULL DEFAULT gen_random_uuid ()::text,
    packaging_transaction_id text NOT NULL,
    action_type action_type NOT NULL,
    old_data jsonb,
    new_data jsonb,
    performed_by text NOT NULL,
    performed_at timestamptz(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT packaging_transaction_audits_pkey PRIMARY KEY (id)
);

--- CreateIndex
CREATE UNIQUE INDEX users_email_key ON users (email);

--- CreateIndex
-- CREATE UNIQUE INDEX packaging_stocks_warehouse_id_packaging_id_key ON packaging_stocks (warehouse_id, packaging_id);
--- ForeignKey
--- AddForeignKey user_roles
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey packaging_stocks
ALTER TABLE packaging_stocks
ADD CONSTRAINT packaging_stocks_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE packaging_stocks
ADD CONSTRAINT packaging_stocks_packaging_id_fkey FOREIGN KEY (packaging_id) REFERENCES packagings (id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey packaging_transaction_items
ALTER TABLE packaging_transaction_items
ADD CONSTRAINT packaging_transaction_items_packaging_stock_id_fkey FOREIGN KEY (packaging_stock_id) REFERENCES packaging_stocks (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE packaging_transaction_items
ADD CONSTRAINT packaging_transaction_items_packaging_transaction_id_fkey FOREIGN KEY (packaging_transaction_id) REFERENCES packaging_transactions (id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE packaging_transaction_audits
ADD CONSTRAINT packaging_transaction_audits_packaging_transaction_id_fkey FOREIGN KEY (packaging_transaction_id) REFERENCES packaging_transactions (id) ON DELETE CASCADE ON UPDATE CASCADE;

--- Function
--- Function auto update updated_at field
CREATE OR REPLACE FUNCTION set_updated_at () RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; 
$$;

-- Create function
CREATE OR REPLACE FUNCTION create_packaging_stocks_for_new_warehouse () RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
INSERT INTO
    packaging_stocks (warehouse_id, packaging_id, quantity)
SELECT
    NEW.id,
    p.id,
    0
FROM
    packagings p;
RETURN NEW;
END;
$$;

--- Function return trigger check quantity befoce DELTE packaging_stocks
CREATE OR REPLACE FUNCTION check_quantity_before_delete () RETURNS TRIGGER AS $$
BEGIN 
    IF OLD.quantity > 0 THEN 
        RAISE EXCEPTION 'Không thể xoá vì quantity = % (phải bằng 0)', OLD.quantity;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

--- 
CREATE TRIGGER trg_check_quantity_before_delete BEFORE DELETE ON packaging_stocks FOR EACH ROW
EXECUTE FUNCTION check_quantity_before_delete ();

--- Create trigger
CREATE TRIGGER trg_create_packaging_stocks_for_warehouse
AFTER INSERT ON warehouses FOR EACH ROW
EXECUTE FUNCTION create_packaging_stocks_for_new_warehouse ();

-- Create function
CREATE OR REPLACE FUNCTION create_packaging_stocks_for_new_packaging () RETURNS TRIGGER AS $$
BEGIN
INSERT INTO
    packaging_stocks (warehouse_id, packaging_id, quantity)
SELECT
    w.id,
    NEW.id,
    0
FROM
    warehouses w;

RETURN NEW;

END;

$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trg_create_packaging_stocks_for_packaging
AFTER INSERT ON packagings FOR EACH ROW
EXECUTE FUNCTION create_packaging_stocks_for_new_packaging ();

---
CREATE OR REPLACE FUNCTION update_packaging_stock () RETURNS TRIGGER AS $$
DECLARE p_stock_id TEXT;

BEGIN IF TG_OP = 'DELETE' THEN p_stock_id := OLD.packaging_stock_id;

ELSE p_stock_id := NEW.packaging_stock_id;

END IF;

UPDATE packaging_stocks
SET
    quantity = (
        SELECT
            COALESCE(SUM(signed_quantity), 0)
        FROM
            packaging_transaction_items
        WHERE
            packaging_stock_id = p_stock_id
    )
WHERE
    id = p_stock_id;

IF TG_OP = 'DELETE' THEN RETURN OLD;

ELSE RETURN NEW;

END IF;

END;

$$ LANGUAGE plpgsql;

-- DROP TRIGGER trg_update_packaging_stocks_quantity ON packaging_transaction_items;
CREATE TRIGGER trg_update_packaging_stocks_quantity
AFTER INSERT
OR
UPDATE
OR DELETE ON packaging_transaction_items FOR EACH ROW
EXECUTE FUNCTION update_packaging_stock ();


SELECT
    pg_terminate_backend(pid)
FROM
    pg_stat_activity
WHERE
    datname = 'pgdb'
    AND pid <> pg_backend_pid();

-- Xoá và tạo lại database
DROP DATABASE pgdb;

CREATE DATABASE pgdb;

---  reset DB bằng SQL
DROP SCHEMA PUBLIC CASCADE;

CREATE SCHEMA PUBLIC;

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT table_schema, table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
          AND table_schema = 'public'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at_%I
             BEFORE UPDATE ON %I.%I
             FOR EACH ROW
             EXECUTE FUNCTION set_updated_at();',
            r.table_name, r.table_schema, r.table_name
        );
    END LOOP;
END;
$$;