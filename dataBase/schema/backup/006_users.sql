CREATE TABLE IF NOT EXISTS users (

    id SERIAL PRIMARY KEY,

    employee_id VARCHAR(20) NOT NULL UNIQUE,

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT,

    login_method VARCHAR(50) NOT NULL DEFAULT 'both',

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