const mysql = require('mysql2/promise');
require('dotenv').config();

const initDB = async () => {
  // Use a raw connection WITHOUT a database specified,
  // so we can CREATE the database if it doesn't exist yet.
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    const dbName = process.env.DB_NAME || 'gym_management';

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await conn.query(`USE \`${dbName}\``);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS membership_plans (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        duration_days INT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS members (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(150),
        address TEXT,
        plan_id INT,
        join_date DATE NOT NULL,
        expiry_date DATE,
        status ENUM('Active','Expired') DEFAULT 'Active',
        qr_token VARCHAR(36) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT PRIMARY KEY AUTO_INCREMENT,
        member_id INT NOT NULL,
        check_in_date DATE NOT NULL,
        check_in_time TIME NOT NULL,
        method ENUM('manual','qr') DEFAULT 'manual',
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        member_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_link TEXT,
        status ENUM('Pending','Paid') DEFAULT 'Pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        member_id INT NOT NULL,
        sent_via ENUM('SMS','WhatsApp') NOT NULL,
        message TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(150),
        date_of_enquiry DATE NOT NULL,
        follow_up_date DATE,
        status ENUM('Open','Converted','Closed') DEFAULT 'Open',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default plans only if none exist
    const [planRows] = await conn.query('SELECT COUNT(*) AS cnt FROM membership_plans');
    if (planRows[0].cnt === 0) {
      await conn.query(`
        INSERT INTO membership_plans (name, price, duration_days, description) VALUES
        ('Monthly',   999.00,  30,  'Standard monthly membership'),
        ('Quarterly', 2499.00, 90,  '3-month membership with savings'),
        ('Yearly',    7999.00, 365, 'Annual membership - best value')
      `);
      console.log('✅ Default membership plans seeded');
    }

    console.log(`✅ Database "${dbName}" and all tables are ready`);
  } finally {
    await conn.end();
  }
};

module.exports = initDB;
