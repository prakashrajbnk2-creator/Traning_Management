import { Router } from 'express';
import {
  getAdminDashboard,
  getAdminReports,
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getAllTrainers,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  assignTrainerToCourse,
  unassignTrainerFromCourse,
  enrollStudentInCourse,
  unenrollStudentFromCourse,
  getAllAttendance,
  getAllAssessments,
  getAllAnnouncements,
  createAnnouncement
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = Router();

// Protect all admin endpoints with ADMIN role check
router.use(authenticate, authorizeRoles('ADMIN'));

// Dashboard & Reports
router.get('/dashboard', getAdminDashboard);
router.get('/reports', getAdminReports);

// Student Management
router.get('/students', getAllStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Trainer Management
router.get('/trainers', getAllTrainers);
router.post('/trainers', createTrainer);
router.put('/trainers/:id', updateTrainer);
router.delete('/trainers/:id', deleteTrainer);

// Course Management
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Assignment Endpoints
router.post('/assign-trainer', assignTrainerToCourse);
router.delete('/unassign-trainer', unassignTrainerFromCourse);
router.post('/enroll-student', enrollStudentInCourse);
router.delete('/unenroll-student', unenrollStudentFromCourse);

// System-wide Views
router.get('/attendance', getAllAttendance);
router.get('/assessments', getAllAssessments);

// Announcements
router.get('/announcements', getAllAnnouncements);
router.post('/announcements', createAnnouncement);

export default router;
