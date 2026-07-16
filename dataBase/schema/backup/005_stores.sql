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