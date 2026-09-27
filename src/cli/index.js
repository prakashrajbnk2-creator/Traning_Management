import readline from 'readline';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/db.js';
import { config } from '../config/env.js';
import { seedDatabase } from '../database/seed.js';
import { renderStudentDashboard, renderTrainerDashboard, renderAdminDashboard } from './dashboards.js';
import * as studentCtrl from '../controllers/studentController.js';
import * as trainerCtrl from '../controllers/trainerController.js';
import * as adminCtrl from '../controllers/adminController.js';

// Ensure DB is initialized
seedDatabase();

function createMockReqRes(user, body = {}, params = {}, query = {}) {
  let responseData = null;
  let statusCode = 200;

  const req = {
    user,
    body,
    params,
    query,
    headers: {}
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  return { req, res, getResult: () => ({ statusCode, data: responseData }) };
}

// Interactive Readline Interface
function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// Authentication Helper
export function authenticateUser(email, password) {
  const user = db.prepare('SELECT id, name, email, password_hash, role, status FROM users WHERE LOWER(email) = ?')
    .get(email.trim().toLowerCase());

  if (!user) {
    return { success: false, message: 'Invalid credentials: User not found.' };
  }

  if (user.status !== 'ACTIVE') {
    return { success: false, message: 'Account is deactivated.' };
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return { success: false, message: 'Invalid credentials: Password incorrect.' };
  }

  if (user.role === 'STUDENT') {
    const student = db.prepare('SELECT id, student_code FROM students WHERE user_id = ?').get(user.id);
    if (student) {
      user.student_id = student.id;
      user.student_code = student.student_code;
    }
  } else if (user.role === 'TRAINER') {
    const trainer = db.prepare('SELECT id, trainer_code, specialization FROM trainers WHERE user_id = ?').get(user.id);
    if (trainer) {
      user.trainer_id = trainer.id;
      user.trainer_code = trainer.trainer_code;
      user.specialization = trainer.specialization;
    }
  }

  return { success: true, user };
}

// ==================== DASHBOARD DISPLAY ====================
export function displayRoleDashboard(user) {
  const { req, res, getResult } = createMockReqRes(user);

  if (user.role === 'STUDENT') {
    studentCtrl.getStudentDashboard(req, res);
    const result = getResult();
    if (result.data && result.data.success) {
      renderStudentDashboard(result.data);
    } else {
      console.log('Error displaying student dashboard:', result.data?.message);
    }
  } else if (user.role === 'TRAINER') {
    trainerCtrl.getTrainerDashboard(req, res);
    const result = getResult();
    if (result.data && result.data.success) {
      renderTrainerDashboard(result.data);
    } else {
      console.log('Error displaying trainer dashboard:', result.data?.message);
    }
  } else if (user.role === 'ADMIN') {
    adminCtrl.getAdminDashboard(req, res);
    const result = getResult();
    if (result.data && result.data.success) {
      renderAdminDashboard(result.data);
    } else {
      console.log('Error displaying admin dashboard:', result.data?.message);
    }
  }
}

// ==================== INTERACTIVE MENUS ====================
async function runStudentMenu(rl, user) {
  while (true) {
    console.log(`
--- Student Options ---
1. View My Dashboard
2. View Enrolled Courses & Modules
3. Mark a Module as Complete
4. View My Attendance
5. View My Assessments & Marks
6. View Announcements
7. Logout to Main Menu
`);
    const choice = (await ask(rl, 'Choose an option (1-7): ')).trim();

    if (choice === '1') {
      displayRoleDashboard(user);
    } else if (choice === '2') {
      const { req, res, getResult } = createMockReqRes(user);
      studentCtrl.getStudentCourses(req, res);
      const r = getResult();
      console.log('\n--- Enrolled Courses & Syllabus ---');
      r.data.courses.forEach(c => {
        console.log(`\n📚 [${c.code}] ${c.title} (Status: ${c.enrollment_status})`);
        console.log(`   Trainers: ${c.trainers.map(t => t.name).join(', ') || 'None assigned'}`);
        console.log(`   Modules:`);
        c.modules.forEach(m => {
          console.log(`     [${m.completed ? '✔ COMPLETED' : '  INCOMPLETE'}] Mod #${m.order_index} (ID: ${m.id}): ${m.title}`);
        });
      });
    } else if (choice === '3') {
      const modId = await ask(rl, 'Enter Module ID to mark complete: ');
      const { req, res, getResult } = createMockReqRes(user, {}, { id: modId });
      studentCtrl.markModuleComplete(req, res);
      const r = getResult();
      console.log(r.data.message);
    } else if (choice === '4') {
      const { req, res, getResult } = createMockReqRes(user);
      studentCtrl.getStudentAttendance(req, res);
      const r = getResult();
      console.log('\n--- Attendance Records ---');
      r.data.attendance.forEach(a => {
        console.log(`Date: ${a.date} | Course: ${a.course_code} | Status: ${a.status} | Marked by: ${a.marked_by || 'Trainer'}`);
      });
    } else if (choice === '5') {
      const { req, res, getResult } = createMockReqRes(user);
      studentCtrl.getStudentAssessments(req, res);
      const r = getResult();
      console.log('\n--- Assessments & Results ---');
      r.data.assessments.forEach(a => {
        console.log(`[${a.course_code}] ${a.title} | Max: ${a.max_marks} | Score: ${a.marks_obtained !== null ? a.marks_obtained : 'Pending'} | Due: ${a.due_date || 'N/A'}`);
        if (a.remarks) console.log(`   Feedback: ${a.remarks}`);
      });
    } else if (choice === '6') {
      const announcements = db.prepare("SELECT title, content, created_at FROM announcements WHERE target_role IN ('ALL', 'STUDENT') ORDER BY created_at DESC").all();
      console.log('\n--- Announcements ---');
      announcements.forEach(a => console.log(`• [${a.created_at.slice(0, 10)}] ${a.title}: ${a.content}`));
    } else if (choice === '7') {
      break;
    }
  }
}

async function runTrainerMenu(rl, user) {
  while (true) {
    console.log(`
--- Trainer Options ---
1. View My Dashboard
2. View Assigned Students
3. View Student Profile & Details
4. View Attendance History
5. Mark Student Attendance
6. View Assessments
7. Create New Assessment
8. Enter Student Marks
9. View Progress Tracking
10. Logout to Main Menu
`);
    const choice = (await ask(rl, 'Choose an option (1-10): ')).trim();

    if (choice === '1') {
      displayRoleDashboard(user);
    } else if (choice === '2') {
      const { req, res, getResult } = createMockReqRes(user);
      trainerCtrl.getTrainerStudents(req, res);
      const r = getResult();
      console.log('\n--- Assigned Students ---');
      r.data.students.forEach(s => {
        console.log(`[ID: ${s.id}] ${s.name} (${s.student_code}) | Email: ${s.email} | Attendance: ${s.attendancePercentage}% | Avg Marks: ${s.averageMarks !== null ? s.averageMarks + '%' : 'N/A'}`);
      });
    } else if (choice === '3') {
      const sId = await ask(rl, 'Enter Student ID: ');
      const { req, res, getResult } = createMockReqRes(user, {}, { id: sId });
      trainerCtrl.getStudentProfileForTrainer(req, res);
      const r = getResult();
      if (!r.data.success) {
        console.log('Error:', r.data.message);
      } else {
        const s = r.data.student;
        console.log(`\nProfile: ${s.name} (${s.student_code}) - Phone: ${s.phone || 'N/A'}`);
        s.progress.forEach(p => {
          console.log(`  Course: [${p.courseCode}] ${p.courseTitle} - Progress: ${p.percentage}% (${p.completedModules}/${p.totalModules} modules completed)`);
        });
      }
    } else if (choice === '4') {
      const date = await ask(rl, 'Filter by date (YYYY-MM-DD) or press Enter for all: ');
      const { req, res, getResult } = createMockReqRes(user, {}, {}, { date: date.trim() || undefined });
      trainerCtrl.getAttendance(req, res);
      const r = getResult();
      console.log('\n--- Attendance Records ---');
      r.data.attendance.forEach(a => {
        console.log(`Date: ${a.date} | Course: ${a.course_code} | Student: ${a.student_name} (${a.student_code}) | Status: ${a.status}`);
      });
    } else if (choice === '5') {
      const studentId = parseInt(await ask(rl, 'Enter Student ID: '), 10);
      const courseId = parseInt(await ask(rl, 'Enter Course ID: '), 10);
      const date = (await ask(rl, 'Enter Date (YYYY-MM-DD): ')).trim();
      const status = (await ask(rl, 'Enter Status (PRESENT / ABSENT / LATE): ')).trim().toUpperCase();

      const { req, res, getResult } = createMockReqRes(user, { student_id: studentId, course_id: courseId, date, status });
      trainerCtrl.markAttendance(req, res);
      const r = getResult();
      console.log(r.data.message);
    } else if (choice === '6') {
      const { req, res, getResult } = createMockReqRes(user);
      trainerCtrl.getTrainerAssessments(req, res);
      const r = getResult();
      console.log('\n--- Assessments in Your Courses ---');
      r.data.assessments.forEach(a => {
        console.log(`[ID: ${a.id}] ${a.title} (${a.course_code}) | Max: ${a.max_marks} | Submissions: ${a.submissions_count} | Due: ${a.due_date || 'N/A'}`);
      });
    } else if (choice === '7') {
      const courseId = parseInt(await ask(rl, 'Enter Course ID: '), 10);
      const title = (await ask(rl, 'Enter Assessment Title: ')).trim();
      const desc = (await ask(rl, 'Enter Description: ')).trim();
      const maxMarks = parseFloat(await ask(rl, 'Enter Max Marks (default 100): ')) || 100;
      const dueDate = (await ask(rl, 'Enter Due Date (YYYY-MM-DD): ')).trim();

      const { req, res, getResult } = createMockReqRes(user, {
        course_id: courseId,
        title,
        description: desc,
        max_marks: maxMarks,
        due_date: dueDate
      });
      trainerCtrl.createAssessment(req, res);
      const r = getResult();
      console.log(r.data.message);
    } else if (choice === '8') {
      const assessmentId = parseInt(await ask(rl, 'Enter Assessment ID: '), 10);
      const studentId = parseInt(await ask(rl, 'Enter Student ID: '), 10);
      const marks = parseFloat(await ask(rl, 'Enter Marks Obtained: '));
      const remarks = (await ask(rl, 'Enter Remarks / Feedback: ')).trim();

      const { req, res, getResult } = createMockReqRes(user, {
        student_id: studentId,
        marks_obtained: marks,
        remarks
      }, { id: assessmentId });

      trainerCtrl.enterMarks(req, res);
      const r = getResult();
      console.log(r.data.message);
    } else if (choice === '9') {
      const { req, res, getResult } = createMockReqRes(user);
      trainerCtrl.getTrainerProgress(req, res);
      const r = getResult();
      console.log('\n--- Student Progress in Assigned Courses ---');
      r.data.progress.forEach(p => {
        console.log(`[${p.courseCode}] ${p.studentName} (${p.studentCode}): ${p.completionPercentage}% (${p.completedModules}/${p.totalModules} modules completed, ${p.remainingModules} remaining)`);
      });
    } else if (choice === '10') {
      break;
    }
  }
}

async function runAdminMenu(rl, user) {
  while (true) {
    console.log(`
--- Admin Options ---
1. View System Dashboard
2. View Comprehensive Reports
3. List All Students
4. Add New Student
5. List All Trainers
6. Add New Trainer
7. List All Courses
8. Create New Course
9. Assign Trainer to Course
10. Enroll Student in Course
11. View All Attendance Records
12. Post Announcement
13. Logout to Main Menu
`);
    const choice = (await ask(rl, 'Choose an option (1-13): ')).trim();

    if (choice === '1') {
      displayRoleDashboard(user);
    } else if (choice === '2') {
      const { req, res, getResult } = createMockReqRes(user);
      adminCtrl.getAdminReports(req, res);
      const r = getResult();
      const rep = r.data.reports;
      console.log('\n--- 📊 SYSTEM REPORTS ---');
      console.log('\nCourse Statistics:');
      rep.courses.forEach(c => {
        console.log(`- [${c.code}] ${c.title}: ${c.enrolled_students} student(s) enrolled, ${c.assigned_trainers} trainer(s), ${c.total_modules} module(s)`);
      });
      console.log(`\nPerformance Overview: Avg Score: ${rep.performance.averageScorePct}% | Min: ${rep.performance.minScorePct}% | Max: ${rep.performance.maxScorePct}%`);
      console.log(`Attendance Records Total: ${rep.attendance.total_records} (Present: ${rep.attendance.present_count}, Late: ${rep.attendance.late_count}, Absent: ${rep.attendance.absent_count})`);
    } else if (choice === '3') {
      const { req, res, getResult } = createMockReqRes(user);
      adminCtrl.getAllStudents(req, res);
      const r = getResult();
      console.log('\n--- All Registered Students ---');
      r.data.students.forEach(s => {
        const courses = s.enrolledCourses.map(c => c.code).join(', ') || 'None';
        console.log(`[ID: ${s.id}] ${s.name} | Code: ${s.student_code} | Email: ${s.email} | Courses: ${courses} | Status: ${s.status}`);
      });
    } else if (choice === '4') {
      const name = (await ask(rl, 'Full Name: ')).trim();
      const email = (await ask(rl, 'Email: ')).trim();
      const password = (await ask(rl, 'Password: ')).trim();
      const code = (await ask(rl, 'Student Code (e.g. STU005): ')).trim();
      const phone = (await ask(rl, 'Phone (optional): ')).trim();

      const { req, res, getResult } = createMockReqRes(user, {
        name, email, password, student_code: code, phone
      });
      adminCtrl.createStudent(req, res);
      const r = getResult();
      console.log(r.data.message);
    } else if (choice === '5') {
      const { req, res, getResult } = createMockReqRes(user);
      adminCtrl.getAllTrainers(req, res);
      const r = getResult();
      console.log('\n--- All Registered Trainers ---');
      r.data.trainers.forEach(t => {
        console.log(`[ID: ${t.id}] ${t.name} | Code: ${t.trainer_code} | Specialization: ${t.specialization} | Courses: ${t.assigned_courses_count}`);
      });
    } else if (choice === '6') {
      const name = (await ask(rl, 'Full Name: ')).trim();
      const email = (await ask(rl, 'Email: ')).trim();
      const password = (await ask(rl, 'Password: ')).trim();
      const code = (await ask(rl, 'Trainer Code (e.g. TRN003): ')).trim();
      const spec = (await ask(rl, 'Specialization: ')).trim();
      const phone = (await ask(rl, 'Phone (optional): ')).trim();

      const { req, res, getResult } = createMockReqRes(user, {
        name, email, password, trainer_code: code, specialization: spec, phone
      });
      adminCtrl.createTrainer(req, res);
      const r = getResult();
      console.log(r.data.message);
    } else if (choice === '7') {
      const { req, res, getResult } = createMockReqRes(user);
      adminCtrl.getAllCourses(req, res);
      const r = getResult();
      console.log('\n--- All Courses ---');
      r.data.courses.forEach(c => {
        console.log(`[ID: ${c.id}] [${c.code}] ${c.title} | Modules: ${c.modules_count} | Students: ${c.students_count} | Trainers: ${c.trainers_count}`);
      });
    } else if (choice === '8') {
      const code = (await ask(rl, 'Course Code (e.g. CS205): ')).trim();
      const title = (await ask(rl, 'Course Title: ')).trim();
      const desc = (await ask(rl, 'Description: ')).trim();

      const { req, res, getResult } = createMockReqRes(user, {
        code, title, description: desc,
        modules: [
          { title: 'Module 1: Foundations' },
          { title: 'Module 2: Advanced Topics' }
        ]
      });
      adminCtrl.createCourse(req, res);
      const r = getResult();
      console.log(r.data.message);
    } else if (choice === '9') {
      const trainerId = parseInt(await ask(rl, 'Trainer ID: '), 10);
      const courseId = parseInt(await ask(rl, 'Course ID: '), 10);

      const { req, res, getResult } = createMockReqRes(user, { trainer_id: trainerId, course_id: courseId });
      adminCtrl.assignTrainerToCourse(req, res);
      const r = getResult();
      console.log(r.data.message);
    } else if (choice === '10') {
      const studentId = parseInt(await ask(rl, 'Student ID: '), 10);
      const courseId = parseInt(await ask(rl, 'Course ID: '), 10);

      const { req, res, getResult } = createMockReqRes(user, { student_id: studentId, course_id: courseId });
      adminCtrl.enrollStudentInCourse(req, res);
      const r = getResult();
      console.log(r.data.message);
    } else if (choice === '11') {
      const { req, res, getResult } = createMockReqRes(user);
      adminCtrl.getAllAttendance(req, res);
      const r = getResult();
      console.log('\n--- System Attendance Records ---');
      r.data.attendance.slice(0, 15).forEach(a => {
        console.log(`Date: ${a.date} | [${a.course_code}] | Student: ${a.student_name} (${a.student_code}) | Status: ${a.status} | Marked By: ${a.marked_by_trainer || 'Admin'}`);
      });
      if (r.data.attendance.length > 15) {
        console.log(`... and ${r.data.attendance.length - 15} more records.`);
      }
    } else if (choice === '12') {
      const title = (await ask(rl, 'Announcement Title: ')).trim();
      const content = (await ask(rl, 'Content: ')).trim();
      const target = (await ask(rl, 'Target (ALL / STUDENT / TRAINER): ')).trim().toUpperCase();

      const { req, res, getResult } = createMockReqRes(user, { title, content, target_role: target || 'ALL' });
      adminCtrl.createAnnouncement(req, res);
      const r = getResult();
      console.log(r.data.message);
    } else if (choice === '13') {
      break;
    }
  }
}

// Main Interactive CLI Loop
export async function runCLI() {
  // Support CLI arguments: node src/cli/index.js --login <email> <password>
  const args = process.argv.slice(2);
  if (args[0] === '--login' && args[1] && args[2]) {
    const email = args[1];
    const password = args[2];
    console.log(`\nLogging in as: ${email}...`);
    const authRes = authenticateUser(email, password);
    if (!authRes.success) {
      console.error('Authentication Error:', authRes.message);
      process.exit(1);
    }
    displayRoleDashboard(authRes.user);
    process.exit(0);
  }

  const rl = createRL();
  console.log(`
======================================================
  🎓 Training Management System (TMS) - CLI Terminal
======================================================
`);

  while (true) {
    console.log(`
1. Login to Training Management System
2. View Quick Demo Credentials
3. Exit CLI
`);
    const mainChoice = (await ask(rl, 'Select an option (1-3): ')).trim();

    if (mainChoice === '1') {
      console.log('\n--- User Login ---');
      const email = (await ask(rl, 'Enter Email: ')).trim();
      const password = (await ask(rl, 'Enter Password: ')).trim();

      const auth = authenticateUser(email, password);
      if (!auth.success) {
        console.log(`\n❌ Login Failed: ${auth.message}`);
        continue;
      }

      console.log(`\n✅ Authenticated as: ${auth.user.name} [Role: ${auth.user.role}]`);

      // Immediately show the appropriate dashboard matching specifications
      displayRoleDashboard(auth.user);

      // Route to role-specific options
      if (auth.user.role === 'ADMIN') {
        await runAdminMenu(rl, auth.user);
      } else if (auth.user.role === 'TRAINER') {
        await runTrainerMenu(rl, auth.user);
      } else if (auth.user.role === 'STUDENT') {
        await runStudentMenu(rl, auth.user);
      }
    } else if (mainChoice === '2') {
      console.log(`
--- Available Demo Credentials ---
[ADMIN]
  Email:    admin@tms.com
  Password: Admin@123

[TRAINER]
  Email:    john@tms.com
  Password: Trainer@123
  Email:    sarah@tms.com
  Password: Trainer@123

[STUDENT]
  Email:    alice@tms.com
  Password: Student@123
  Email:    bob@tms.com
  Password: Student@123
  Email:    diana@tms.com
  Password: Student@123
`);
    } else if (mainChoice === '3') {
      console.log('Goodbye!');
      rl.close();
      process.exit(0);
    }
  }
}

// Auto-run if executed directly from terminal
if (process.argv[1] && process.argv[1].endsWith('cli\\index.js') || process.argv[1]?.endsWith('cli/index.js')) {
  runCLI();
}
