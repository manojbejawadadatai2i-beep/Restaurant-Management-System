CREATE TABLE district_kpis (

    kpi_id BIGSERIAL PRIMARY KEY,

    district_id INTEGER NOT NULL
        REFERENCES districts(id)
        ON DELETE CASCADE,

    kpi_date DATE NOT NULL,

    total_stores INTEGER NOT NULL DEFAULT 0,

    active_stores INTEGER NOT NULL DEFAULT 0,

    total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,

    total_orders INTEGER NOT NULL DEFAULT 0,

    average_order_value NUMERIC(12,2) NOT NULL DEFAULT 0,

    customer_count INTEGER NOT NULL DEFAULT 0,

    cancelled_orders INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_district_kpi
        UNIQUE (district_id, kpi_date)
);

-- indexing 
CREATE INDEX idx_district_kpis_district
ON district_kpis(district_id);

CREATE INDEX idx_district_kpis_date
ON district_kpis(kpi_date);

CREATE INDEX idx_district_kpis_district_date
ON district_kpis(district_id, kpi_date);