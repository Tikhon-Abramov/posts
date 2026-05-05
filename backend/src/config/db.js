const mysql = require('mysql2/promise');

const env = require('./env');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
});

async function testDbConnection() {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
    console.log('[db] MySQL connected');
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testDbConnection,
};
