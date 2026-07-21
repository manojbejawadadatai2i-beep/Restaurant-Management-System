import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Load configuration with default fallbacks for local development
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL environment variable is not defined. Falling back to local default: postgresql://postgres:postgres@localhost:5432/postgres');
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});