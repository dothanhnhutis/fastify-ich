-- config database
CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER DATABASE pgdb
SET datestyle = 'ISO, MDY';
--- tạo biến local cho connection hiện tại
-- SET "audit.user" = 'Người_A';
-- SELECT current_setting('audit.user', true);
-- CreateTable
CREATE TABLE IF NOT EXISTS users (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    CONSTRAINT users_pkey PRIMARY KEY (id)
);
-- CreateTable
CREATE TABLE IF NOT EXISTS roles (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    permissions TEXT [] NOT NULL DEFAULT ARRAY []::text [],
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);
-- CreateTable
CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id)
);
-- CreateEnum
CREATE TYPE transaction_type AS ENUM ('IMPORT', 'EXPORT', 'ADJUST');
-- CreateTable
CREATE TABLE IF NOT EXISTS warehouses (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    CONSTRAINT warehouses_pkey PRIMARY KEY (id)
);
-- CreateTable
CREATE TABLE IF NOT EXISTS packagings (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    CONSTRAINT packagings_pkey PRIMARY KEY (id)
);
-- CreateTable
CREATE TABLE IF NOT EXISTS packaging_stocks (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    warehouse_id TEXT NOT NULL,
    packaging_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    CONSTRAINT packaging_stocks_pkey PRIMARY KEY (id)
);
--- CreateTable
CREATE TABLE IF NOT EXISTS packaging_transactions (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    type transaction_type NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    CONSTRAINT packaging_transactions_pkey PRIMARY KEY (id)
);
--- CreateTable
CREATE TABLE IF NOT EXISTS packaging_transaction_items (
    packaging_stock_id TEXT NOT NULL,
    packaging_transaction_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    signed_quantity INTEGER NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    CONSTRAINT packaging_transaction_items_pkey PRIMARY KEY (packaging_stock_id, packaging_transaction_id)
);
-- CreateEnum
CREATE TYPE action_type AS ENUM ('CREATE', 'UPDATE', 'DELETE');
--- CreateTable
CREATE TABLE IF NOT EXISTS packaging_transaction_audits (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    packaging_transaction_id TEXT NOT NULL,
    action_type action_type NOT NULL,
    old_data JSONB,
    new_data JSONB,
    performed_by TEXT NOT NULL,
    performed_at TIMESTAMP(3) NOT NULL DEFAULT now(),
    CONSTRAINT packaging_transaction_audits_pkey PRIMARY KEY (id)
);
-- CreateIndex
CREATE UNIQUE INDEX users_email_key ON users(email);
-- CreateIndex
CREATE UNIQUE INDEX packaging_stocks_warehouse_id_packaging_id_key ON packaging_stocks(warehouse_id, packaging_id);
-- AddForeignKey
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE packaging_stocks
ADD CONSTRAINT packaging_stocks_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE packaging_stocks
ADD CONSTRAINT packaging_stocks_packaging_id_fkey FOREIGN KEY (packaging_id) REFERENCES packagings(id) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE packaging_transaction_items
ADD CONSTRAINT packaging_transaction_items_packaging_stock_id_fkey FOREIGN KEY (packaging_stock_id) REFERENCES packaging_stocks(id) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE packaging_transaction_items
ADD CONSTRAINT packaging_transaction_items_packaging_transaction_id_fkey FOREIGN KEY (packaging_transaction_id) REFERENCES packaging_transactions(id) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE packaging_transaction_audits
ADD CONSTRAINT packaging_transaction_audits_packaging_transaction_id_fkey FOREIGN KEY (packaging_transaction_id) REFERENCES packaging_transactions(id) ON DELETE CASCADE ON UPDATE CASCADE;
-- Create function auto update updated_at field
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create function
CREATE OR REPLACE FUNCTION create_packaging_stocks_for_new_warehouse() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO packaging_stocks (warehouse_id, packaging_id, quantity)
SELECT NEW.id,
    p.id,
    0
FROM packagings p;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger
CREATE TRIGGER trg_create_packaging_stocks_for_warehouse
AFTER
INSERT ON warehouses FOR EACH ROW EXECUTE FUNCTION create_packaging_stocks_for_new_warehouse();
-- Create function
CREATE OR REPLACE FUNCTION create_packaging_stocks_for_new_packaging() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO packaging_stocks (warehouse_id, packaging_id, quantity)
SELECT w.id,
    NEW.id,
    0
FROM warehouses w;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger
CREATE TRIGGER trg_create_packaging_stocks_for_packaging
AFTER
INSERT ON packagings FOR EACH ROW EXECUTE FUNCTION create_packaging_stocks_for_new_packaging();
---
CREATE OR REPLACE FUNCTION update_packaging_stock() RETURNS TRIGGER AS $$
DECLARE p_stock_id TEXT;
BEGIN IF TG_OP = 'DELETE' THEN p_stock_id := OLD.packaging_stock_id;
ELSE p_stock_id := NEW.packaging_stock_id;
END IF;
UPDATE packaging_stocks
SET quantity = (
        SELECT COALESCE(SUM(signed_quantity), 0)
        FROM packaging_transaction_items
        WHERE packaging_stock_id = p_stock_id
    )
WHERE id = p_stock_id;
IF TG_OP = 'DELETE' THEN RETURN OLD;
ELSE RETURN NEW;
END IF;
END;
$$ LANGUAGE plpgsql;
--
-- DROP TRIGGER trg_update_packaging_stocks_quantity ON packaging_transaction_items;
CREATE TRIGGER trg_update_packaging_stocks_quantity
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON packaging_transaction_items FOR EACH ROW EXECUTE FUNCTION update_packaging_stock();
-- create function
-- CREATE OR REPLACE FUNCTION log_packaging_transaction_audit() RETURNS TRIGGER AS $$
-- DECLARE action TEXT;
-- changed_data JSONB;
-- performed_by TEXT;
-- BEGIN -- Lấy user từ session (nếu chưa set sẽ là NULL)
-- performed_by := current_setting('app.user', true);
-- -- Xác định loại hành động
-- IF TG_OP = 'INSERT' THEN action := 'CREATE'::action_type;
-- changed_data := to_jsonb(NEW);
-- ELSIF TG_OP = 'UPDATE' THEN action := 'UPDATE'::action_type;
-- changed_data := jsonb_build_object(
--     'old',
--     to_jsonb(OLD),
--     'new',
--     to_jsonb(NEW)
-- );
-- ELSIF TG_OP = 'DELETE' THEN action := 'DELETE'::action_type;
-- changed_data := to_jsonb(OLD);
-- END IF;
-- -- Ghi log
-- INSERT INTO packaging_transaction_audits (
--         packaging_transaction_id,
--         actionType,
--         changedData,
--         performedBy
--     )
-- VALUES (
--         COALESCE(NEW.id, OLD.id),
--         action,
--         changed_data,
--         COALESCE(performed_by, 'unknown')
--     );
-- RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
---
-- DROP FUNCTION if EXISTS log_packaging_transaction_audit();
-- DROP TRIGGER trg_packaging_transaction_audit ON packaging_transactions;
-- create Trigger 
-- CREATE TRIGGER trg_packaging_transaction_audit
-- AFTER
-- INSERT
--     OR
-- UPDATE
--     OR DELETE ON packaging_transactions FOR EACH ROW EXECUTE FUNCTION log_packaging_transaction_audit();
--- reset DB bằng shell
-- Đóng tất cả kết nối (nếu database đang dùng)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'pgdb'
    AND pid <> pg_backend_pid();
-- Xoá và tạo lại database
DROP DATABASE pgdb;
CREATE DATABASE pgdb;
---  reset DB bằng SQL
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;