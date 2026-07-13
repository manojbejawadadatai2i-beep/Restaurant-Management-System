-- ============================================================================
-- RESTAURANT MANAGEMENT SYSTEM - CONSOLIDATED DATABASE SCHEMA
-- ============================================================================
-- This single schema file consolidates all tables and indexes.
-- Order of creation matches entity relationships and dependency requirements
-- to prevent foreign key errors.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. roles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. corporates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corporates (
    id SERIAL PRIMARY KEY,
    corporate_code VARCHAR(20) NOT NULL UNIQUE,
    corporate_name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. regions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    corporate_id INTEGER NOT NULL,
    region_code VARCHAR(20) NOT NULL UNIQUE,
    region_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_region_corporate
        FOREIGN KEY (corporate_id)
        REFERENCES corporates(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_region_name
        UNIQUE(corporate_id, region_name)
);

-- ----------------------------------------------------------------------------
-- 4. districts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL,
    district_code VARCHAR(20) NOT NULL UNIQUE,
    district_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_district_region
        FOREIGN KEY (region_id)
        REFERENCES regions(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_district_name
        UNIQUE(region_id, district_name)
);

-- ----------------------------------------------------------------------------
-- 5. stores
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    district_id INTEGER NOT NULL,
    store_code VARCHAR(20) NOT NULL UNIQUE,
    store_name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    manager_name VARCHAR(100),
    opened_on DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_store_district
        FOREIGN KEY (district_id)
        REFERENCES districts(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_store_status
        CHECK (status IN ('ACTIVE','INACTIVE')),

    CONSTRAINT uq_store_name
        UNIQUE(district_id, store_name)
);

-- ----------------------------------------------------------------------------
-- 6. users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT,
    google_id VARCHAR(255) UNIQUE,
    role_id INTEGER NOT NULL,
    corporate_id INTEGER NOT NULL,
    region_id INTEGER,
    district_id INTEGER,
    store_id INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id),

    CONSTRAINT fk_user_corporate
        FOREIGN KEY (corporate_id)
        REFERENCES corporates(id),

    CONSTRAINT fk_user_region
        FOREIGN KEY (region_id)
        REFERENCES regions(id),

    CONSTRAINT fk_user_district
        FOREIGN KEY (district_id)
        REFERENCES districts(id),

    CONSTRAINT fk_user_store
        FOREIGN KEY (store_id)
        REFERENCES stores(id)
);

-- ----------------------------------------------------------------------------
-- 7. daily_store_kpis
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_store_kpis (
    kpi_id BIGSERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL,
    kpi_date DATE NOT NULL,
    total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (total_revenue >= 0),
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

CREATE INDEX IF NOT EXISTS idx_daily_store_kpis_store ON daily_store_kpis(store_id);
CREATE INDEX IF NOT EXISTS idx_daily_store_kpis_date ON daily_store_kpis(kpi_date);
CREATE INDEX IF NOT EXISTS idx_daily_store_kpis_store_date ON daily_store_kpis(store_id, kpi_date);

-- ----------------------------------------------------------------------------
-- 8. district_kpis
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS district_kpis (
    kpi_id BIGSERIAL PRIMARY KEY,
    district_id INTEGER NOT NULL,
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

    CONSTRAINT fk_district_kpi
        FOREIGN KEY (district_id)
        REFERENCES districts(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_district_kpi
        UNIQUE (district_id, kpi_date)
);

CREATE INDEX IF NOT EXISTS idx_district_kpis_district ON district_kpis(district_id);
CREATE INDEX IF NOT EXISTS idx_district_kpis_date ON district_kpis(kpi_date);
CREATE INDEX IF NOT EXISTS idx_district_kpis_district_date ON district_kpis(district_id, kpi_date);

-- ----------------------------------------------------------------------------
-- 9. region_kpis
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS region_kpis (
    kpi_id BIGSERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL,
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

    CONSTRAINT fk_region_kpi
        FOREIGN KEY (region_id)
        REFERENCES regions(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_region_kpi
        UNIQUE(region_id, kpi_date)
);

CREATE INDEX IF NOT EXISTS idx_region_kpis_region ON region_kpis(region_id);
CREATE INDEX IF NOT EXISTS idx_region_kpis_date ON region_kpis(kpi_date);
CREATE INDEX IF NOT EXISTS idx_region_kpis_region_date ON region_kpis(region_id, kpi_date);

-- ----------------------------------------------------------------------------
-- 10. corporate_kpis
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corporate_kpis (
    kpi_id BIGSERIAL PRIMARY KEY,
    corporate_id INTEGER NOT NULL,
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

    CONSTRAINT fk_corporate_kpi
        FOREIGN KEY (corporate_id)
        REFERENCES corporates(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_corporate_kpi
        UNIQUE (corporate_id, kpi_date)
);

CREATE INDEX IF NOT EXISTS idx_corporate_kpis_corporate ON corporate_kpis(corporate_id);
CREATE INDEX IF NOT EXISTS idx_corporate_kpis_date ON corporate_kpis(kpi_date);
CREATE INDEX IF NOT EXISTS idx_corporate_kpis_corporate_date ON corporate_kpis(corporate_id, kpi_date);

-- ----------------------------------------------------------------------------
-- 11. generated_reports
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS generated_reports (
    report_id BIGSERIAL PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(20) NOT NULL
        CHECK (
            report_type IN (
                'DAILY',
                'WEEKLY',
                'MONTHLY',
                'CUSTOM'
            )
        ),
    generated_by INTEGER NOT NULL,
    corporate_id INTEGER,
    region_id INTEGER,
    district_id INTEGER,
    store_id INTEGER,
    report_date DATE NOT NULL,
    file_format VARCHAR(10)
        CHECK (
            file_format IN (
                'PDF',
                'CSV',
                'EXCEL'
            )
        ),
    file_path TEXT,
    ai_summary TEXT,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reports_user
        FOREIGN KEY (generated_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_reports_corporate
        FOREIGN KEY (corporate_id)
        REFERENCES corporates(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reports_region
        FOREIGN KEY (region_id)
        REFERENCES regions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reports_district
        FOREIGN KEY (district_id)
        REFERENCES districts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reports_store
        FOREIGN KEY (store_id)
        REFERENCES stores(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reports_user ON generated_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_reports_date ON generated_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_reports_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_store ON generated_reports(store_id);
