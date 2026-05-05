const app = require('./app');
const env = require('./config/env');
const { testDbConnection } = require('./config/db');

async function startServer() {
  try {
    await testDbConnection();

    app.listen(env.port, () => {
      console.log(`[server] API running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('[server] Failed to start server');
    console.error(error);
    process.exit(1);
  }
}

startServer();
