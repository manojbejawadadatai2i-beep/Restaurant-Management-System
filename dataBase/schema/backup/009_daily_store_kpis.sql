-- =====================================================
-- 007_daily_store_kpis.sql
-- Daily KPI snapshot for each restaurant store
-- =====================================================

CREATE TABLE daily_store_kpis (

    kpi_id BIGSERIAL PRIMARY KEY,

    store_id INTEGER NOT NULL,

    kpi_date DATE NOT NULL,

    total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (total_revenue >= 0),

    today_expenses NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (today_expenses >= 0),

    total_orders INTEGER NOT NULL DEFAULT 0
        CHECK (total_orders >= 0),

    average_order_value NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (average_order_value >= 0),

    customer_count INTEGER NOT NULL DEFAULT 0
        CHECK (customer_count >= 0),

    cancelled_orders INTEGER NOT NULL DEFAULT 0
        CHECK (cancelled_orders >= 0),

    online_orders INTEGER NOT NULL DEFAULT 0
        CHECK (online_orders >= 0),

    takeaway_orders INTEGER NOT NULL DEFAULT 0
        CHECK (takeaway_orders >= 0),

    dine_in_orders INTEGER NOT NULL DEFAULT 0
        CHECK (dine_in_orders >= 0),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_daily_store
        FOREIGN KEY (store_id)
        REFERENCES stores(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_store_kpi
        UNIQUE (store_id, kpi_date)
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX idx_daily_store_kpis_store
ON daily_store_kpis(store_id);

CREATE INDEX idx_daily_store_kpis_date
ON daily_store_kpis(kpi_date);

CREATE INDEX idx_daily_store_kpis_store_date
ON daily_store_kpis(store_id, kpi_date);