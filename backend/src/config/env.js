const dotenv = require('dotenv');

dotenv.config();

const requiredEnvVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[env] Missing environment variable: ${key}`);
  }
});

const env = {
  port: Number(process.env.PORT) || 3005,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pulsefeed_db',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  uploadsDir: process.env.UPLOADS_DIR || 'uploads',
};

module.exports = env;
