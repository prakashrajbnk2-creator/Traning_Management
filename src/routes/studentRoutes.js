import { Router } from 'express';
import {
  getStudentDashboard,
  getStudentCourses,
  markModuleComplete,
  getStudentAttendance,
  getStudentAssessments
} from '../controllers/studentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = Router();

// Apply auth and student role check to all student routes
router.use(authenticate, authorizeRoles('STUDENT'));

router.get('/dashboard', getStudentDashboard);
router.get('/courses', getStudentCourses);
router.post('/modules/:id/complete', markModuleComplete);
router.get('/attendance', getStudentAttendance);
router.get('/assessments', getStudentAssessments);

export default router;
