-- =====================================================
-- 013_generated_reports.sql
-- Stores generated reports
-- =====================================================

CREATE TABLE generated_reports (

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

    generated_by INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    corporate_id INTEGER
        REFERENCES corporates(id)
        ON DELETE CASCADE,

    region_id INTEGER
        REFERENCES regions(id)
        ON DELETE CASCADE,

    district_id INTEGER
        REFERENCES districts(id)
        ON DELETE CASCADE,

    store_id INTEGER
        REFERENCES stores(id)
        ON DELETE CASCADE,

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

    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ======================================
-- Indexes
-- ======================================

CREATE INDEX idx_reports_user
ON generated_reports(generated_by);

CREATE INDEX idx_reports_date
ON generated_reports(report_date);

CREATE INDEX idx_reports_type
ON generated_reports(report_type);

CREATE INDEX idx_reports_store
ON generated_reports(store_id);