import app from './app.js';
import { config } from './config/env.js';
import { seedDatabase } from './database/seed.js';

// Initialize and ensure database schema & seeds exist
seedDatabase();

const server = app.listen(config.port, () => {
  console.log(`
======================================================
  🎓 Training Management System (TMS) API Server
======================================================
  Status:      Online & Listening
  Port:        ${config.port}
  Base URL:    http://localhost:${config.port}
  Environment: ${config.nodeEnv}

  Available Roles & Test Credentials:
  - Admin:   admin@tms.com   / Admin@123
  - Trainer: john@tms.com    / Trainer@123
  - Student: alice@tms.com   / Student@123
======================================================
`);
});

export default server;
