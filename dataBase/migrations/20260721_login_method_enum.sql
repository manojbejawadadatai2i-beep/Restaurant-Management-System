-- Migration: convert freeform `login_method` to explicit enum-like values
-- 2026-07-21

BEGIN;

-- 1) Normalize existing values:
-- Map historical values to new set: 'password_only', 'google_only', 'both'
UPDATE users
SET login_method = CASE
    WHEN LOWER(login_method) LIKE '%google%' THEN 'google_only'
    WHEN LOWER(login_method) LIKE '%password%' THEN 'both'
    ELSE 'both'
END;

-- 2) Ensure column length and default
ALTER TABLE users
    ALTER COLUMN login_method TYPE VARCHAR(20),
    ALTER COLUMN login_method SET DEFAULT 'both';

-- 3) Add a CHECK constraint to restrict allowed values
ALTER TABLE users
    ADD CONSTRAINT chk_users_login_method
    CHECK (login_method IN ('password_only','google_only','both'));

COMMIT;

-- Notes:
-- Run this file using psql or your DB client against the application's database.
-- Example:
-- psql -h <host> -U <user> -d <db> -f dataBase/migrations/20260721_login_method_enum.sql
