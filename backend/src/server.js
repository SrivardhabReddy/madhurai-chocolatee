import app from './app.js';
import { config } from './config/index.js';
import { initDatabase } from './db/index.js';
import { runSeeds } from './db/seed.js';

async function startServer() {
  try {
    console.log('🚀 Initializing Madhurai Chocolate Backend...');
    
    // 1. Immediately bind HTTP server to port so Render detects readiness in < 200ms
    const server = app.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🍫 MADHURAI CHOCOLATE BACKEND API IS LIVE`);
      console.log(`   Port:           ${config.port}`);
      console.log(`   URL:            http://localhost:${config.port}`);
      console.log(`   Environment:    ${config.env}`);
      console.log(`   Customer Web:   ${config.customerAppUrl}`);
      console.log(`   Admin Web:      ${config.adminAppUrl}`);
      console.log(`======================================================\n`);
    });

    // 2. Connect to database and verify schemas asynchronously (non-blocking)
    initDatabase()
      .then(() => runSeeds())
      .catch((err) => {
        console.error('⚠️ Database startup notice:', err.message);
      });

    const shutdown = (signal) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down...`);
      server.close(() => {
        console.log('Backend HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    console.error('❌ Failed to start backend server:', err);
    process.exit(1);
  }
}

startServer();
