-- Migration: Add image_url to restaurants table
-- Run once: mysql -u root -p shelflife < migrate_restaurant_image.sql

USE shelflife;

ALTER TABLE restaurants
  ADD COLUMN image_url VARCHAR(500);

SELECT 'Migration complete: image_url column added to restaurants table.' AS status;
