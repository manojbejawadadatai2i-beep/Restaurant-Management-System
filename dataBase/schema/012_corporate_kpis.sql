-- =====================================================
-- 012_corporate_kpis.sql
-- Daily KPI snapshot for each corporate
-- =====================================================

CREATE TABLE corporate_kpis (

    kpi_id BIGSERIAL PRIMARY KEY,

    corporate_id INTEGER NOT NULL
        REFERENCES corporates(id)
        ON DELETE CASCADE,

    kpi_date DATE NOT NULL,

    total_regions INTEGER NOT NULL DEFAULT 0,

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

    CONSTRAINT uq_corporate_kpi
        UNIQUE (corporate_id, kpi_date)
);
CREATE INDEX idx_corporate_kpis_corporate
ON corporate_kpis(corporate_id);

CREATE INDEX idx_corporate_kpis_date
ON corporate_kpis(kpi_date);

CREATE INDEX idx_corporate_kpis_corporate_date
ON corporate_kpis(corporate_id, kpi_date);