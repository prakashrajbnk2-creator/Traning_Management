import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/db.js';
import { config } from '../config/env.js';

export function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.prepare(`
      SELECT id, name, email, password_hash, role, status
      FROM users
      WHERE LOWER(email) = ?
    `).get(trimmedEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently inactive. Please contact an administrator.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Role-specific profile lookup
    let profile = null;
    let dashboardRoute = '/api/admin/dashboard';

    if (user.role === 'STUDENT') {
      profile = db.prepare('SELECT id, student_code, phone FROM students WHERE user_id = ?').get(user.id);
      dashboardRoute = '/api/student/dashboard';
    } else if (user.role === 'TRAINER') {
      profile = db.prepare('SELECT id, trainer_code, specialization, phone FROM trainers WHERE user_id = ?').get(user.id);
      dashboardRoute = '/api/trainer/dashboard';
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: profile && user.role === 'STUDENT' ? profile.id : null,
      trainerId: profile && user.role === 'TRAINER' ? profile.id : null
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profile
      },
      dashboardRoute
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login processing error.',
      error: error.message
    });
  }
}

export function getCurrentUser(req, res) {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
      error: error.message
    });
  }
}
