import { Router } from 'express';
import {
  getTrainerDashboard,
  getTrainerCourses,
  getTrainerStudents,
  getStudentProfileForTrainer,
  getAttendance,
  markAttendance,
  updateAttendance,
  getTrainerAssessments,
  createAssessment,
  getAssessmentResults,
  enterMarks,
  getTrainerProgress
} from '../controllers/trainerController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = Router();

// Secure all trainer routes with auth and TRAINER role verification
router.use(authenticate, authorizeRoles('TRAINER'));

router.get('/dashboard', getTrainerDashboard);
router.get('/courses', getTrainerCourses);
router.get('/students', getTrainerStudents);
router.get('/students/:id', getStudentProfileForTrainer);

// Attendance routes
router.get('/attendance', getAttendance);
router.post('/attendance', markAttendance);
router.put('/attendance/:id', updateAttendance);

// Assessment & Marks routes
router.get('/assessments', getTrainerAssessments);
router.post('/assessments', createAssessment);
router.get('/assessments/:id/results', getAssessmentResults);
router.post('/assessments/:id/marks', enterMarks);

// Progress routes
router.get('/progress', getTrainerProgress);

export default router;
