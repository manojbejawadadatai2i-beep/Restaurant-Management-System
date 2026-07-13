-- =====================================================
-- 008_generated_reports.sql
-- Stores generated reports and AI summaries
-- =====================================================

CREATE TABLE generated_reports (

    report_id BIGSERIAL PRIMARY KEY,

    report_type VARCHAR(20) NOT NULL
        CHECK (
            report_type IN (
                'daily',
                'weekly',
                'monthly',
                'custom',
                'ai_summary'
            )
        ),

    generated_for_level VARCHAR(20) NOT NULL
        CHECK (
            generated_for_level IN (
                'store',
                'district',
                'region',
                'corporate'
            )
        ),

    store_id INTEGER NULL
        REFERENCES stores(store_id)
        ON DELETE SET NULL,

    district_id INTEGER NULL
        REFERENCES districts(district_id)
        ON DELETE SET NULL,

    region_id INTEGER NULL
        REFERENCES regions(region_id)
        ON DELETE SET NULL,

    report_start_date DATE NOT NULL,
    report_end_date DATE NOT NULL,

    report_title VARCHAR(255) NOT NULL,

    report_summary TEXT,

    ai_insights TEXT,

    generated_by INTEGER
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    report_status VARCHAR(20) NOT NULL DEFAULT 'completed'
        CHECK (
            report_status IN (
                'pending',
                'processing',
                'completed',
                'failed'
            )
        ),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_report_dates
        CHECK (report_end_date >= report_start_date)
);

CREATE INDEX idx_reports_type
ON generated_reports(report_type);

CREATE INDEX idx_reports_created
ON generated_reports(created_at DESC);

CREATE INDEX idx_reports_store
ON generated_reports(store_id);

CREATE INDEX idx_reports_district
ON generated_reports(district_id);

CREATE INDEX idx_reports_region
ON generated_reports(region_id);