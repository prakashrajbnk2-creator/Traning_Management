import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import db from '../database/db.js';

export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid format. Please provide a Bearer token.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token. Please log in again.'
      });
    }

    // Fetch user details from database
    const user = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator.'
      });
    }

    // Enrich with role-specific IDs
    if (user.role === 'STUDENT') {
      const studentProfile = db.prepare('SELECT id, student_code FROM students WHERE user_id = ?').get(user.id);
      if (studentProfile) {
        user.student_id = studentProfile.id;
        user.student_code = studentProfile.student_code;
      }
    } else if (user.role === 'TRAINER') {
      const trainerProfile = db.prepare('SELECT id, trainer_code, specialization FROM trainers WHERE user_id = ?').get(user.id);
      if (trainerProfile) {
        user.trainer_id = trainerProfile.id;
        user.trainer_code = trainerProfile.trainer_code;
        user.specialization = trainerProfile.specialization;
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      error: error.message
    });
  }
}

export default authenticate;
