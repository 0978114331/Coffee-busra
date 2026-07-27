/*
# Coffee Busra - Core Schema

## Overview
Single-tenant Point of Sale + Customer Ordering system for "Coffee Busra" cafe.
No user accounts/sign-in — access is gated by configurable PIN codes stored in
the `settings` table. All tables are therefore readable/writable by the
anon-key frontend (the anon role is what the public Supabase client uses).

## New Tables

1. `tables` — dining tables in the cafe
   - `id` uuid primary key
   - `num` integer, unique table number (e.g. 1, 2, 3)
   - `status` text: 'free' | 'occupied'
   - `current_orders` integer: count of active orders at this table

2. `menu_items` — products available to order
   - `id` uuid primary key
   - `name` text
   - `cat` text (category, e.g. "Coffee", "Tea", "Pastry")
   - `description` text (nullable)
   - `price` numeric(10,2)
   - `image` text (URL, nullable)
   - `available` boolean (default true)

3. `orders` — customer orders
   - `id` bigint primary key (generated from a sequence, displayed as "#id")
   - `table_num` integer
   - `items` jsonb (array of line items)
   - `total` numeric(10,2)
   - `note` text (nullable special instructions)
   - `status` text: 'pending' | 'preparing' | 'ready' | 'done'
   - `payment_currency` text (nullable: 'USD' | 'KHR')
   - `exchange_rate` integer (nullable)
   - `cash_received` numeric(10,2) (nullable)
   - `change` numeric(10,2) (nullable)
   - `lat` double precision (nullable)
   - `lng` double precision (nullable)
   - `created_at` timestamptz default now()

4. `settings` — singleton row of system configuration
   - `id` integer primary key (always 1)
   - `exchange_rate` integer (default 4100)
   - `admin_pin` text (nullable; empty = no protection)
   - `customer_pin` text (nullable; empty = no protection)
   - `tg_token` text (nullable Telegram bot token)
   - `tg_chat_id` text (nullable Telegram chat id)
   - `created_at` timestamptz default now()
   - `updated_at` timestamptz default now()

5. `promos` — singleton row controlling the customer promo carousel
   - `id` integer primary key (always 1)
   - `active` boolean default true
   - `images` text[] (array of image URLs)
   - `created_at` timestamptz default now()

## Security (RLS)
- RLS enabled on every table.
- All tables use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is intentionally public/shared single-tenant data gated by app-level
  PINs (not Supabase Auth accounts). The anon-key client must be able to read and
  write for the POS to function.

## Realtime
- `orders`, `tables`, `menu_items`, `settings`, `promos` added to the publication
  so the admin dashboard, kitchen, and customer app all sync instantly.

## Notes
1. A sequence `orders_id_seq` starts at 101 so order numbers display as #101+.
2. Seed rows for `settings` (id=1) and `promos` (id=1) are inserted.
3. Seed tables and a small set of menu items are inserted for demo purposes.
*/

-- ===== TABLES =====
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  num integer NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'free',
  current_orders integer NOT NULL DEFAULT 0
);

-- ===== MENU ITEMS =====
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cat text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  image text,
  available boolean NOT NULL DEFAULT true
);

-- ===== ORDERS =====
CREATE SEQUENCE IF NOT EXISTS orders_id_seq START 101;

CREATE TABLE IF NOT EXISTS orders (
  id bigint PRIMARY KEY DEFAULT nextval('orders_id_seq'),
  table_num integer NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric(10,2) NOT NULL DEFAULT 0,
  note text,
  status text NOT NULL DEFAULT 'pending',
  payment_currency text,
  exchange_rate integer,
  cash_received numeric(10,2),
  change numeric(10,2),
  lat double precision,
  lng double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_table_num_idx ON orders (table_num);

-- ===== SETTINGS =====
CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1,
  exchange_rate integer NOT NULL DEFAULT 4100,
  admin_pin text NOT NULL DEFAULT '',
  customer_pin text NOT NULL DEFAULT '',
  tg_token text NOT NULL DEFAULT '',
  tg_chat_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);

-- ===== PROMOS =====
CREATE TABLE IF NOT EXISTS promos (
  id integer PRIMARY KEY DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  images text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promos_singleton CHECK (id = 1)
);

-- ===== RLS =====
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos ENABLE ROW LEVEL SECURITY;

-- tables policies
DROP POLICY IF EXISTS "anon_select_tables" ON tables;
CREATE POLICY "anon_select_tables" ON tables FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tables" ON tables;
CREATE POLICY "anon_insert_tables" ON tables FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tables" ON tables;
CREATE POLICY "anon_update_tables" ON tables FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tables" ON tables;
CREATE POLICY "anon_delete_tables" ON tables FOR DELETE TO anon, authenticated USING (true);

-- menu_items policies
DROP POLICY IF EXISTS "anon_select_menu_items" ON menu_items;
CREATE POLICY "anon_select_menu_items" ON menu_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_menu_items" ON menu_items;
CREATE POLICY "anon_insert_menu_items" ON menu_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_menu_items" ON menu_items;
CREATE POLICY "anon_update_menu_items" ON menu_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_menu_items" ON menu_items;
CREATE POLICY "anon_delete_menu_items" ON menu_items FOR DELETE TO anon, authenticated USING (true);

-- orders policies
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE TO anon, authenticated USING (true);

-- settings policies
DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- promos policies
DROP POLICY IF EXISTS "anon_select_promos" ON promos;
CREATE POLICY "anon_select_promos" ON promos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_update_promos" ON promos;
CREATE POLICY "anon_update_promos" ON promos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ===== REALTIME PUBLICATION =====
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
ALTER PUBLICATION supabase_realtime ADD TABLE promos;

-- ===== SEED DATA =====
INSERT INTO settings (id, exchange_rate, admin_pin, customer_pin, tg_token, tg_chat_id)
VALUES (1, 4100, '', '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO promos (id, active, images)
VALUES (1, true, ARRAY['https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1200&h=400&fit=crop'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO tables (num, status, current_orders)
SELECT n, 'free', 0 FROM generate_series(1, 6) n
ON CONFLICT (num) DO NOTHING;

-- Demo menu items (only if table is empty)
INSERT INTO menu_items (name, cat, description, price, image, available)
SELECT * FROM (VALUES
  ('Iced Latte', 'Coffee', 'Cold espresso with milk', 3.50, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500', true),
  ('Cappuccino', 'Coffee', 'Espresso with steamed milk', 3.00, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500', true),
  ('Americano', 'Coffee', 'Espresso with hot water', 2.50, 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500', true),
  ('Caramel Macchiato', 'Coffee', 'Espresso with caramel and milk', 3.75, 'https://images.unsplash.com/photo-1485808191679-5f8d68aba428?w=500', true),
  ('Mocha', 'Coffee', 'Chocolate espresso drink', 3.75, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500', true),
  ('Cold Brew', 'Coffee', 'Slow steeped cold coffee', 4.00, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500', true),
  ('Green Tea', 'Tea', 'Classic green tea', 2.00, 'https://images.unsplash.com/photo-1564890369478-c89ca6d218c7?w=500', true),
  ('Milk Tea', 'Tea', 'Creamy milk tea', 2.50, 'https://images.unsplash.com/photo-1558857563-c0c6ee6d8a5b?w=500', true),
  ('Lemon Tea', 'Tea', 'Refreshing lemon tea', 2.25, 'https://images.unsplash.com/photo-1626231403780-8c0a2c8f2c1f?w=500', true),
  ('Mango Smoothie', 'Smoothie', 'Fresh mango blended', 3.50, 'https://images.unsplash.com/photo-1505252585461-04d1d99da43b?w=500', true),
  ('Strawberry Smoothie', 'Smoothie', 'Fresh strawberry blended', 3.50, 'https://images.unsplash.com/photo-1505252585461-04d1d99da43b?w=500', true),
  ('Croissant', 'Pastry', 'French butter pastry', 2.00, 'https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?w=500', true),
  ('Chocolate Cake', 'Pastry', 'Rich chocolate slice', 3.00, 'https://images.unsplash.com/photo-1606313564200-757ac6345dee?w=500', true),
  ('Cheesecake', 'Pastry', 'New York style', 3.50, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500', true),
  ('Sandwich', 'Food', 'Club sandwich', 4.50, 'https://images.unsplash.com/photo-1521305916504-4a118118a59d?w=500', true)
) AS v(name, cat, description, price, image, available)
WHERE NOT EXISTS (SELECT 1 FROM menu_items);
