-- =====================================================
-- 009_region_kpis.sql
-- Daily KPI snapshot for each region
-- =====================================================

CREATE TABLE region_kpis (

    kpi_id BIGSERIAL PRIMARY KEY,

    region_id INTEGER NOT NULL
        REFERENCES regions(id)
        ON DELETE CASCADE,

    kpi_date DATE NOT NULL,

    total_districts INTEGER NOT NULL DEFAULT 0,

    total_stores INTEGER NOT NULL DEFAULT 0,

    active_stores INTEGER NOT NULL DEFAULT 0,

    total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,

    total_orders INTEGER NOT NULL DEFAULT 0,

    average_order_value NUMERIC(12,2) NOT NULL DEFAULT 0,

    customer_count INTEGER NOT NULL DEFAULT 0,

    cancelled_orders INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_region_kpi
        UNIQUE(region_id, kpi_date)
);
CREATE INDEX idx_region_kpis_region
ON region_kpis(region_id);

CREATE INDEX idx_region_kpis_date
ON region_kpis(kpi_date);

CREATE INDEX idx_region_kpis_region_date
ON region_kpis(region_id, kpi_date);