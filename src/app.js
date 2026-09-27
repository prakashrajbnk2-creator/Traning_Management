import express from 'express';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import trainerRoutes from './routes/trainerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

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

// Root and Health Check
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'HEALTHY', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
