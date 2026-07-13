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