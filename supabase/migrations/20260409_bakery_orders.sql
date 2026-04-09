-- ─── products: items a bakery sells online ───────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id      UUID        NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  description  TEXT,
  price        INTEGER     NOT NULL,  -- in cents (e.g. 150 = 1,50€)
  category     TEXT        NOT NULL DEFAULT 'other',  -- pain, viennoiserie, patisserie, snack
  photo_url    TEXT,
  emoji        TEXT,
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_owner_all"  ON products FOR ALL    TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "products_public_read" ON products FOR SELECT TO anon, authenticated USING (active = TRUE);

-- ─── orders: a customer purchase ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             UUID        NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- bakery owner
  customer_name       TEXT        NOT NULL,
  customer_email      TEXT        NOT NULL,
  customer_phone      TEXT,
  status              TEXT        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','paid','preparing','ready','delivered','cancelled')),
  total_cents         INTEGER     NOT NULL,
  stripe_session_id   TEXT        UNIQUE,
  stripe_payment_intent TEXT,
  note                TEXT,        -- customer note
  pickup_at           TIMESTAMPTZ, -- requested pickup time
  read_at             TIMESTAMPTZ, -- when bakery owner first viewed this order
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_owner_all"   ON orders FOR ALL    TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "orders_public_insert" ON orders FOR INSERT TO anon, authenticated WITH CHECK (TRUE);
CREATE POLICY "orders_service_all"  ON orders FOR ALL    TO service_role USING (TRUE);

-- ─── order_items: line items in an order ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID    REFERENCES products(id) ON DELETE SET NULL,
  name        TEXT    NOT NULL,  -- snapshot of product name at purchase time
  price_cents INTEGER NOT NULL,  -- snapshot of price at purchase time
  quantity    INTEGER NOT NULL DEFAULT 1,
  photo_url   TEXT
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_via_order" ON order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "order_items_service"   ON order_items FOR ALL TO service_role USING (TRUE);
CREATE POLICY "order_items_public_insert" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (TRUE);

-- ─── Add Stripe Connect + orders fields to profiles ──────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_id         TEXT;    -- Stripe Connect account ID
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_onboarded  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orders_enabled             BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS products_site_id_idx    ON products(site_id);
CREATE INDEX IF NOT EXISTS orders_site_id_idx      ON orders(site_id);
CREATE INDEX IF NOT EXISTS orders_status_idx       ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx   ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
