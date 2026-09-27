import { Router } from 'express';
import { login, getCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public login endpoint
router.post('/login', login);

// Authenticated current user endpoint
router.get('/me', authenticate, getCurrentUser);

export default router;
