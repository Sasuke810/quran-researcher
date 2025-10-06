-- Database initialization script
-- This script runs first to set up the database for migrations

-- Create the schema_migrations table for tracking migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    checksum VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_version 
ON schema_migrations (version);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at 
ON schema_migrations (executed_at);

-- Log that initialization is complete
INSERT INTO schema_migrations (id, name, version, checksum, execution_time_ms)
VALUES ('0000', 'init_database', '0000', 'init', 0)
ON CONFLICT (id) DO NOTHING;
