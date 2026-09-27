import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import trainerRoutes from './routes/trainerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../client/dist');

export const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[HTTP] ${req.method} ${req.url}`);
  }
  next();
});

// Serve frontend static files if built
const hasClientBuild = fs.existsSync(clientDistPath);
if (hasClientBuild) {
  app.use(express.static(clientDistPath));
}

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'HEALTHY', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/admin', adminRoutes);

// Frontend SPA fallback for GET requests (or API documentation if no client build)
if (hasClientBuild) {
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Welcome to the Training Management System (TMS) REST API',
      version: '1.0.0',
      documentation: {
        auth: '/api/auth/login',
        student: '/api/student/dashboard',
        trainer: '/api/trainer/dashboard',
        admin: '/api/admin/dashboard'
      }
    });
  });
}

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
