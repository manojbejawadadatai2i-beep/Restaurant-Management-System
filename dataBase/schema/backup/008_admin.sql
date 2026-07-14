-- =====================================================
-- 008_admin.sql
-- Admin table referencing corporates
-- =====================================================

CREATE TABLE admin (
    admin_id SERIAL PRIMARY KEY,
    corporate_id INTEGER NOT NULL
        REFERENCES corporates(id)
        ON DELETE CASCADE,
    corporate_name VARCHAR(100) NOT NULL
        REFERENCES corporates(corporate_name)
        ON UPDATE CASCADE
);
