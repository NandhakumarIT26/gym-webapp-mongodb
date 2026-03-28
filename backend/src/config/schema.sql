-- Gym Management Database Schema
-- Run this file to set up the database

CREATE DATABASE IF NOT EXISTS gym_management;
USE gym_management;

-- Users (gym owner login)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membership Plans
CREATE TABLE IF NOT EXISTS membership_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members
CREATE TABLE IF NOT EXISTS members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  address TEXT,
  plan_id INT,
  join_date DATE NOT NULL,
  expiry_date DATE,
  status ENUM('Active', 'Expired') DEFAULT 'Active',
  qr_token VARCHAR(36) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON DELETE SET NULL
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  member_id INT NOT NULL,
  check_in_date DATE NOT NULL,
  check_in_time TIME NOT NULL,
  method ENUM('manual', 'qr') DEFAULT 'manual',
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  member_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_link TEXT,
  status ENUM('Pending', 'Paid') DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Enquiries
CREATE TABLE IF NOT EXISTS enquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  date_of_enquiry DATE NOT NULL,
  follow_up_date DATE,
  status ENUM('Open', 'Converted', 'Closed') DEFAULT 'Open',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  member_id INT NOT NULL,
  sent_via ENUM('SMS', 'WhatsApp') NOT NULL,
  message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Seed: Default admin user (password: admin123)
INSERT IGNORE INTO users (username, password_hash) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

-- Seed: Default membership plans
INSERT IGNORE INTO membership_plans (id, name, price, duration_days, description) VALUES
(1, 'Monthly', 999.00, 30, 'Standard monthly membership'),
(2, 'Quarterly', 2499.00, 90, '3-month membership with savings'),
(3, 'Yearly', 7999.00, 365, 'Annual membership - best value');
