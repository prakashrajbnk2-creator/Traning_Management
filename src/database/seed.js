import bcrypt from 'bcryptjs';
import db from './db.js';
import { initializeDatabase } from './schema.js';

export function seedDatabase() {
  initializeDatabase();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('[Database] Database already seeded. Skipping seed.');
    return;
  }

  console.log('[Database] Seeding initial data...');

  const saltRounds = 10;
  const adminHash = bcrypt.hashSync('Admin@123', saltRounds);
  const trainerHash = bcrypt.hashSync('Trainer@123', saltRounds);
  const studentHash = bcrypt.hashSync('Student@123', saltRounds);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertStudent = db.prepare(`
    INSERT INTO students (user_id, student_code, phone)
    VALUES (?, ?, ?)
  `);

  const insertTrainer = db.prepare(`
    INSERT INTO trainers (user_id, trainer_code, specialization, phone)
    VALUES (?, ?, ?, ?)
  `);

  const insertCourse = db.prepare(`
    INSERT INTO courses (code, title, description, status)
    VALUES (?, ?, ?, ?)
  `);

  const insertModule = db.prepare(`
    INSERT INTO course_modules (course_id, title, description, order_index)
    VALUES (?, ?, ?, ?)
  `);

  const insertTrainerAssignment = db.prepare(`
    INSERT INTO trainer_assignments (trainer_id, course_id)
    VALUES (?, ?)
  `);

  const insertEnrollment = db.prepare(`
    INSERT INTO enrollments (student_id, course_id, status)
    VALUES (?, ?, ?)
  `);

  const insertProgress = db.prepare(`
    INSERT INTO student_progress (student_id, module_id, completed, completed_at)
    VALUES (?, ?, ?, ?)
  `);

  const insertAttendance = db.prepare(`
    INSERT INTO attendance (student_id, course_id, date, status, marked_by_trainer_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAssessment = db.prepare(`
    INSERT INTO assessments (course_id, trainer_id, title, description, max_marks, due_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertResult = db.prepare(`
    INSERT INTO assessment_results (assessment_id, student_id, marks_obtained, remarks)
    VALUES (?, ?, ?, ?)
  `);

  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (title, content, target_role, author_id)
    VALUES (?, ?, ?, ?)
  `);

  // Transaction for atomic seed
  const transaction = db.transaction(() => {
    // 1. Admin
    const adminUser = insertUser.run('System Administrator', 'admin@tms.com', adminHash, 'ADMIN', 'ACTIVE');
    const adminId = adminUser.lastInsertRowid;

    // 2. Trainers
    const trainer1User = insertUser.run('John Doe', 'john@tms.com', trainerHash, 'TRAINER', 'ACTIVE');
    const t1 = insertTrainer.run(trainer1User.lastInsertRowid, 'TRN001', 'Web Development & Full-Stack JS', '+1-555-0101');

    const trainer2User = insertUser.run('Sarah Smith', 'sarah@tms.com', trainerHash, 'TRAINER', 'ACTIVE');
    const t2 = insertTrainer.run(trainer2User.lastInsertRowid, 'TRN002', 'Python, Data Science & AI', '+1-555-0102');

    // 3. Students
    const student1User = insertUser.run('Alice Johnson', 'alice@tms.com', studentHash, 'STUDENT', 'ACTIVE');
    const s1 = insertStudent.run(student1User.lastInsertRowid, 'STU001', '+1-555-0201');

    const student2User = insertUser.run('Bob Miller', 'bob@tms.com', studentHash, 'STUDENT', 'ACTIVE');
    const s2 = insertStudent.run(student2User.lastInsertRowid, 'STU002', '+1-555-0202');

    const student3User = insertUser.run('Charlie Brown', 'charlie@tms.com', studentHash, 'STUDENT', 'ACTIVE');
    const s3 = insertStudent.run(student3User.lastInsertRowid, 'STU003', '+1-555-0203');

    const student4User = insertUser.run('Diana Prince', 'diana@tms.com', studentHash, 'STUDENT', 'ACTIVE');
    const s4 = insertStudent.run(student4User.lastInsertRowid, 'STU004', '+1-555-0204');

    // 4. Courses & Modules
    const c1 = insertCourse.run('CS101', 'Full-Stack Web Development', 'Master frontend, backend, APIs, and modern deployment', 'ACTIVE');
    const c1m1 = insertModule.run(c1.lastInsertRowid, 'HTML5 & Modern CSS', 'Responsive web layout with Flexbox & Grid', 1);
    const c1m2 = insertModule.run(c1.lastInsertRowid, 'JavaScript ES6+ Deep Dive', 'Asynchronous programming, closures, prototypes', 2);
    const c1m3 = insertModule.run(c1.lastInsertRowid, 'Express.js REST APIs', 'Routing, middleware, JWT authentication, SQLite', 3);
    const c1m4 = insertModule.run(c1.lastInsertRowid, 'React Frontend Architecture', 'Hooks, state management, component lifecycles', 4);

    const c2 = insertCourse.run('DS201', 'Python for Data Science', 'Data analysis, statistics, pandas, and machine learning', 'ACTIVE');
    const c2m1 = insertModule.run(c2.lastInsertRowid, 'Python Core Programming', 'Data structures, OOP, file I/O', 1);
    const c2m2 = insertModule.run(c2.lastInsertRowid, 'Pandas & NumPy Analytics', 'Data transformation, grouping, time series', 2);
    const c2m3 = insertModule.run(c2.lastInsertRowid, 'Data Visualization', 'Matplotlib, Seaborn, exploratory data analysis', 3);
    const c2m4 = insertModule.run(c2.lastInsertRowid, 'Machine Learning Basics', 'Supervised learning, classification, evaluation', 4);

    const c3 = insertCourse.run('DB301', 'Database Management Systems', 'Relational database modeling, query optimization, transactions', 'ACTIVE');
    const c3m1 = insertModule.run(c3.lastInsertRowid, 'Relational Modeling & Normalization', 'ER diagrams, 1NF to 3NF', 1);
    const c3m2 = insertModule.run(c3.lastInsertRowid, 'Advanced SQL Mastery', 'Joins, subqueries, CTEs, window functions', 2);
    const c3m3 = insertModule.run(c3.lastInsertRowid, 'Indexing & Query Optimization', 'B-trees, query execution plans, transactions', 3);

    // 5. Trainer Assignments
    insertTrainerAssignment.run(t1.lastInsertRowid, c1.lastInsertRowid);
    insertTrainerAssignment.run(t1.lastInsertRowid, c3.lastInsertRowid);
    insertTrainerAssignment.run(t2.lastInsertRowid, c2.lastInsertRowid);
    insertTrainerAssignment.run(t2.lastInsertRowid, c3.lastInsertRowid);

    // 6. Enrollments
    insertEnrollment.run(s1.lastInsertRowid, c1.lastInsertRowid, 'ACTIVE');
    insertEnrollment.run(s1.lastInsertRowid, c3.lastInsertRowid, 'ACTIVE');

    insertEnrollment.run(s2.lastInsertRowid, c1.lastInsertRowid, 'ACTIVE');
    insertEnrollment.run(s2.lastInsertRowid, c2.lastInsertRowid, 'ACTIVE');

    insertEnrollment.run(s3.lastInsertRowid, c2.lastInsertRowid, 'ACTIVE');

    insertEnrollment.run(s4.lastInsertRowid, c1.lastInsertRowid, 'ACTIVE');
    insertEnrollment.run(s4.lastInsertRowid, c2.lastInsertRowid, 'ACTIVE');
    insertEnrollment.run(s4.lastInsertRowid, c3.lastInsertRowid, 'ACTIVE');

    // 7. Progress Tracking
    // Alice completed 3/4 modules in CS101 (75%), 1/3 in DB301 (33%)
    insertProgress.run(s1.lastInsertRowid, c1m1.lastInsertRowid, 1, '2026-09-01 10:00:00');
    insertProgress.run(s1.lastInsertRowid, c1m2.lastInsertRowid, 1, '2026-09-10 11:30:00');
    insertProgress.run(s1.lastInsertRowid, c1m3.lastInsertRowid, 1, '2026-09-20 14:00:00');
    insertProgress.run(s1.lastInsertRowid, c3m1.lastInsertRowid, 1, '2026-09-15 09:00:00');

    // Bob completed 2/4 modules in CS101 (50%), 1/4 in DS201 (25%)
    insertProgress.run(s2.lastInsertRowid, c1m1.lastInsertRowid, 1, '2026-09-02 10:00:00');
    insertProgress.run(s2.lastInsertRowid, c1m2.lastInsertRowid, 1, '2026-09-12 11:00:00');
    insertProgress.run(s2.lastInsertRowid, c2m1.lastInsertRowid, 1, '2026-09-05 15:00:00');

    // Charlie completed 1/4 in DS201 (25%)
    insertProgress.run(s3.lastInsertRowid, c2m1.lastInsertRowid, 1, '2026-09-06 14:00:00');

    // Diana completed 2/4 in CS101 (50%), 1/4 in DS201 (25%), 1/3 in DB301 (33%)
    insertProgress.run(s4.lastInsertRowid, c1m1.lastInsertRowid, 1, '2026-09-03 10:00:00');
    insertProgress.run(s4.lastInsertRowid, c1m2.lastInsertRowid, 1, '2026-09-13 11:00:00');
    insertProgress.run(s4.lastInsertRowid, c2m1.lastInsertRowid, 1, '2026-09-07 14:00:00');
    insertProgress.run(s4.lastInsertRowid, c3m1.lastInsertRowid, 1, '2026-09-16 09:00:00');

    // 8. Attendance Records
    const dates = ['2026-09-15', '2026-09-18', '2026-09-22', '2026-09-25'];
    
    // Alice CS101 attendance: 4/4 Present (100%) or DB301
    insertAttendance.run(s1.lastInsertRowid, c1.lastInsertRowid, dates[0], 'PRESENT', t1.lastInsertRowid);
    insertAttendance.run(s1.lastInsertRowid, c1.lastInsertRowid, dates[1], 'PRESENT', t1.lastInsertRowid);
    insertAttendance.run(s1.lastInsertRowid, c1.lastInsertRowid, dates[2], 'PRESENT', t1.lastInsertRowid);
    insertAttendance.run(s1.lastInsertRowid, c1.lastInsertRowid, dates[3], 'PRESENT', t1.lastInsertRowid);

    // Alice DB301 attendance: 3/4 (75%)
    insertAttendance.run(s1.lastInsertRowid, c3.lastInsertRowid, dates[0], 'PRESENT', t1.lastInsertRowid);
    insertAttendance.run(s1.lastInsertRowid, c3.lastInsertRowid, dates[1], 'PRESENT', t1.lastInsertRowid);
    insertAttendance.run(s1.lastInsertRowid, c3.lastInsertRowid, dates[2], 'LATE', t1.lastInsertRowid);
    insertAttendance.run(s1.lastInsertRowid, c3.lastInsertRowid, dates[3], 'ABSENT', t1.lastInsertRowid);

    // Bob CS101: 2/4 Present, 1 Late, 1 Absent (50% or 62%)
    insertAttendance.run(s2.lastInsertRowid, c1.lastInsertRowid, dates[0], 'PRESENT', t1.lastInsertRowid);
    insertAttendance.run(s2.lastInsertRowid, c1.lastInsertRowid, dates[1], 'ABSENT', t1.lastInsertRowid);
    insertAttendance.run(s2.lastInsertRowid, c1.lastInsertRowid, dates[2], 'LATE', t1.lastInsertRowid);
    insertAttendance.run(s2.lastInsertRowid, c1.lastInsertRowid, dates[3], 'ABSENT', t1.lastInsertRowid);

    // Charlie DS201: 4/4 Present
    insertAttendance.run(s3.lastInsertRowid, c2.lastInsertRowid, dates[0], 'PRESENT', t2.lastInsertRowid);
    insertAttendance.run(s3.lastInsertRowid, c2.lastInsertRowid, dates[1], 'PRESENT', t2.lastInsertRowid);
    insertAttendance.run(s3.lastInsertRowid, c2.lastInsertRowid, dates[2], 'PRESENT', t2.lastInsertRowid);
    insertAttendance.run(s3.lastInsertRowid, c2.lastInsertRowid, dates[3], 'PRESENT', t2.lastInsertRowid);

    // Diana CS101: 4/4 Present
    insertAttendance.run(s4.lastInsertRowid, c1.lastInsertRowid, dates[0], 'PRESENT', t1.lastInsertRowid);
    insertAttendance.run(s4.lastInsertRowid, c1.lastInsertRowid, dates[1], 'PRESENT', t1.lastInsertRowid);
    insertAttendance.run(s4.lastInsertRowid, c1.lastInsertRowid, dates[2], 'PRESENT', t1.lastInsertRowid);
    insertAttendance.run(s4.lastInsertRowid, c1.lastInsertRowid, dates[3], 'PRESENT', t1.lastInsertRowid);

    // 9. Assessments
    const a1 = insertAssessment.run(
      c1.lastInsertRowid,
      t1.lastInsertRowid,
      'JavaScript ES6 Mastery Exam',
      'Evaluation of modern JavaScript concepts, Promises, and Array methods',
      100,
      '2026-09-18'
    );

    const a2 = insertAssessment.run(
      c1.lastInsertRowid,
      t1.lastInsertRowid,
      'Express.js REST API Project',
      'Build a secured REST API with authentication and SQLite storage',
      100,
      '2026-10-15'
    );

    const a3 = insertAssessment.run(
      c2.lastInsertRowid,
      t2.lastInsertRowid,
      'Pandas Data Cleaning & Analysis',
      'Analyze exploratory dataset and generate summary metrics',
      100,
      '2026-09-20'
    );

    const a4 = insertAssessment.run(
      c2.lastInsertRowid,
      t2.lastInsertRowid,
      'Machine Learning Pipeline Project',
      'Train, tune, and evaluate a predictive model',
      100,
      '2026-10-25'
    );

    const a5 = insertAssessment.run(
      c3.lastInsertRowid,
      t1.lastInsertRowid,
      'Relational Database Modeling & SQL',
      'Create 3NF normalized tables and perform complex multi-table joins',
      100,
      '2026-09-24'
    );

    // 10. Assessment Results
    // Alice results
    insertResult.run(a1.lastInsertRowid, s1.lastInsertRowid, 86, 'Strong understanding of async/await and array methods');
    insertResult.run(a5.lastInsertRowid, s1.lastInsertRowid, 82, 'Good schema normalization and clean join syntax');

    // Bob results (Lower marks - Needs Attention candidate)
    insertResult.run(a1.lastInsertRowid, s2.lastInsertRowid, 54, 'Needs review on closures and promises');
    insertResult.run(a3.lastInsertRowid, s2.lastInsertRowid, 58, 'Missing edge case handling in data wrangling');

    // Charlie results
    insertResult.run(a3.lastInsertRowid, s3.lastInsertRowid, 94, 'Outstanding analysis and clean pandas code');

    // Diana results
    insertResult.run(a1.lastInsertRowid, s4.lastInsertRowid, 95, 'Flawless execution and code structure');
    insertResult.run(a3.lastInsertRowid, s4.lastInsertRowid, 91, 'Comprehensive visualization and interpretation');
    insertResult.run(a5.lastInsertRowid, s4.lastInsertRowid, 89, 'Well-optimized queries with index analysis');

    // 11. Announcements
    insertAnnouncement.run('Welcome to Fall 2026 Training Session', 'Welcome to the Training Management System. Please review your enrolled courses and upcoming assessments.', 'ALL', adminId);
    insertAnnouncement.run('Midterm Assessment Dates Announced', 'All students must complete their Phase 1 assessments before the end of next week.', 'STUDENT', adminId);
    insertAnnouncement.run('Faculty Curriculum Sync Meeting', 'Trainers are requested to finalize grading for previous assessments by Friday.', 'TRAINER', adminId);
  });

  transaction();
  console.log('[Database] Seed data successfully populated!');
}

// Allow direct CLI execution: node src/database/seed.js
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}

export default seedDatabase;
