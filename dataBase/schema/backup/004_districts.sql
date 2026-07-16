CREATE TABLE IF NOT EXISTS districts (

    id SERIAL PRIMARY KEY,

    region_id INTEGER NOT NULL,

    district_code VARCHAR(20) NOT NULL UNIQUE,

    district_name VARCHAR(100) NOT NULL,

    manager_name VARCHAR(100),

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