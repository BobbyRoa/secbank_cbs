-- Secbank CBS - Database Initialization Script
-- This script runs when the MySQL container is first created

-- Set character encoding
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Grant privileges to the application user
GRANT ALL PRIVILEGES ON secbank.* TO 'secbank_user'@'%';
FLUSH PRIVILEGES;

-- Note: The actual table creation is handled by Drizzle ORM migrations
-- Run `pnpm db:push` after the containers are up to create/update tables
