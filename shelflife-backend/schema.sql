-- =====================================================
--  SHELFLIFE+ Database Schema
--  Run: mysql -u root -p < schema.sql
-- =====================================================

CREATE DATABASE IF NOT EXISTS shelflife;
USE shelflife;

-- Users (all roles stored here)
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  phone       VARCHAR(20),
  role        ENUM('user','owner','ngo') NOT NULL DEFAULT 'user',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
d	

-- Delivery addresses for users
CREATE TABLE IF NOT EXISTS user_addresses (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id  INT NOT NULL,
  address  VARCHAR(300),
  city     VARCHAR(100),
  pincode  VARCHAR(10),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Restaurants owned by owners
CREATE TABLE IF NOT EXISTS restaurants (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  owner_id         INT NOT NULL,
  restaurant_name  VARCHAR(200) NOT NULL,
  location         VARCHAR(300),
  city             VARCHAR(100),
  contact_number   VARCHAR(20),
  image_url        VARCHAR(500),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Food items listed by owners
CREATE TABLE IF NOT EXISTS food_items (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id  INT NOT NULL,
  name           VARCHAR(200) NOT NULL,
  description    TEXT,
  category       VARCHAR(100),
  is_veg         TINYINT(1) DEFAULT 1,
  original_price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2) NOT NULL,
  quantity       INT NOT NULL DEFAULT 0,
  unit           VARCHAR(50) DEFAULT 'pieces',
  weight_kg      DECIMAL(8,3) DEFAULT 0.250,
  expiry_date    DATE,
  expiry_time    TIME,
  image_url      VARCHAR(500),
  is_active      TINYINT(1) DEFAULT 1,
  ngo_eligible   TINYINT(1) DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Orders placed by users
CREATE TABLE IF NOT EXISTS orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  restaurant_id   INT NOT NULL,
  total_amount    DECIMAL(10,2) NOT NULL,
  original_amount DECIMAL(10,2) NOT NULL,
  saved_amount    DECIMAL(10,2) NOT NULL,
  co2_saved_kg    DECIMAL(8,3)  NOT NULL DEFAULT 0,
  delivery_address TEXT,
  payment_method  VARCHAR(50),
  status          ENUM('pending','confirmed','preparing','ready','delivered','cancelled') DEFAULT 'pending',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

-- Items in each order
CREATE TABLE IF NOT EXISTS order_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT NOT NULL,
  food_item_id INT NOT NULL,
  quantity     INT NOT NULL,
  unit_price   DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (food_item_id) REFERENCES food_items(id)
);

-- NGO donation offers
CREATE TABLE IF NOT EXISTS donation_offers (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id  INT NOT NULL,
  ngo_id         INT,
  title          VARCHAR(200),
  notes          TEXT,
  pickup_date    DATE,
  pickup_slot    VARCHAR(100),
  status         ENUM('open','pending','accepted','completed','declined') DEFAULT 'open',
  decline_reason TEXT,
  ngo_notes      TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (ngo_id) REFERENCES users(id)
);

-- Items in each donation offer
CREATE TABLE IF NOT EXISTS donation_offer_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  offer_id    INT NOT NULL,
  food_item_id INT NOT NULL,
  quantity    INT NOT NULL,
  FOREIGN KEY (offer_id) REFERENCES donation_offers(id) ON DELETE CASCADE,
  FOREIGN KEY (food_item_id) REFERENCES food_items(id)
);

-- JWT refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_food_items_restaurant ON food_items(restaurant_id);
CREATE INDEX idx_food_items_active     ON food_items(is_active);
CREATE INDEX idx_orders_user           ON orders(user_id);
CREATE INDEX idx_orders_restaurant     ON orders(restaurant_id);
CREATE INDEX idx_donation_ngo          ON donation_offers(ngo_id);
CREATE INDEX idx_donation_restaurant   ON donation_offers(restaurant_id);

SELECT 'SHELFLIFE+ schema created successfully!' AS status;
ALTER TABLE restaurants
  ADD COLUMN image_url VARCHAR(500);

SELECT 'Migration complete: image_url column added to restaurants table.' AS status;
SELECT * FROM restaurants;

-- ngo_profiles (or extend users table for NGO role)
ALTER TABLE users ADD COLUMN registration_number VARCHAR(50);
ALTER TABLE users ADD COLUMN admin_name VARCHAR(100);
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN focus_area VARCHAR(100);
ALTER TABLE users ADD COLUMN city VARCHAR(50);
ALTER TABLE users ADD COLUMN pincode VARCHAR(10);

-- ngo_settings
CREATE TABLE ngo_settings (
  user_id INT PRIMARY KEY,
  notif_new_offer BOOLEAN DEFAULT TRUE,
  notif_pickup_reminder BOOLEAN DEFAULT TRUE,
  notif_offer_expiry BOOLEAN DEFAULT TRUE,
  notif_weekly_summary BOOLEAN DEFAULT FALSE,
  avail_from TIME DEFAULT '08:00',
  avail_until TIME DEFAULT '21:00',
  preferred_cities VARCHAR(200),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ngo_restaurant_partners
CREATE TABLE ngo_restaurant_partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ngo_user_id INT NOT NULL,
  restaurant_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (ngo_user_id, restaurant_id),
  FOREIGN KEY (ngo_user_id) REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);
SELECT * FROM  ngo_restaurant_partners;

-- Fix 1: adds is_primary to user_addresses
ALTER TABLE user_addresses ADD COLUMN is_primary TINYINT(1) DEFAULT 0;

-- Fix 2: adds added_at to ngo_restaurant_partners  
ALTER TABLE ngo_restaurant_partners ADD COLUMN added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE users ADD COLUMN login_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN last_login  TIMESTAMP NULL DEFAULT NULL;