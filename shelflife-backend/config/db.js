const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'shelflife',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  // Return DATE columns as 'YYYY-MM-DD' strings, not JS Date objects
  // Prevents timezone shift (e.g. 2025-03-23 becoming 2025-03-22 in UTC+5:30)
  dateStrings:        true,
  timezone:           'local',
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
