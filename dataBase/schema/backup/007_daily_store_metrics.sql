-- =====================================================
-- 007_daily_store_metrics.sql
-- Stores daily aggregated KPIs for every restaurant
-- =====================================================

CREATE TABLE daily_store_metrics (
    metric_id BIGSERIAL PRIMARY KEY,

    store_id INTEGER NOT NULL
        REFERENCES stores(store_id)
        ON DELETE CASCADE,

    metric_date DATE NOT NULL,

    total_orders INTEGER NOT NULL DEFAULT 0
        CHECK (total_orders >= 0),

    total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (total_revenue >= 0),

    avg_order_value NUMERIC(10,2) GENERATED ALWAYS AS (
        CASE
            WHEN total_orders = 0 THEN 0
            ELSE total_revenue / total_orders
        END
    ) STORED,

    cancelled_orders INTEGER NOT NULL DEFAULT 0
        CHECK (cancelled_orders >= 0),

    dine_in_orders INTEGER NOT NULL DEFAULT 0
        CHECK (dine_in_orders >= 0),

    takeaway_orders INTEGER NOT NULL DEFAULT 0
        CHECK (takeaway_orders >= 0),

    online_orders INTEGER NOT NULL DEFAULT 0
        CHECK (online_orders >= 0),

    customer_count INTEGER NOT NULL DEFAULT 0
        CHECK (customer_count >= 0),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_store_metric UNIQUE (store_id, metric_date)
);

CREATE INDEX idx_daily_metrics_store
ON daily_store_metrics(store_id);

CREATE INDEX idx_daily_metrics_date
ON daily_store_metrics(metric_date);

CREATE INDEX idx_daily_metrics_store_date
ON daily_store_metrics(store_id, metric_date);