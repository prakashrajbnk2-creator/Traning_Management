import db from './db.js';

export function initializeDatabase() {
  const schemaSql = `
    -- Users table (Base identity for Admin, Trainer, Student)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('ADMIN', 'TRAINER', 'STUDENT')) NOT NULL,
      status TEXT CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Students profile table (1:1 with users)
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_code TEXT UNIQUE NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Trainers profile table (1:1 with users)
    CREATE TABLE IF NOT EXISTS trainers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      trainer_code TEXT UNIQUE NOT NULL,
      specialization TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Courses table
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Course Modules table (1:N with courses)
    CREATE TABLE IF NOT EXISTS course_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Trainer Assignments (M:N between trainers and courses)
    CREATE TABLE IF NOT EXISTS trainer_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trainer_id INTEGER NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(trainer_id, course_id)
    );

    -- Student Enrollments (M:N between students and courses)
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT CHECK(status IN ('ACTIVE', 'COMPLETED', 'DROPPED')) DEFAULT 'ACTIVE',
      UNIQUE(student_id, course_id)
    );

    -- Student Module Progress
    CREATE TABLE IF NOT EXISTS student_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      module_id INTEGER NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
      completed INTEGER DEFAULT 0 CHECK(completed IN (0, 1)),
      completed_at DATETIME,
      UNIQUE(student_id, module_id)
    );

    -- Attendance records
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      status TEXT CHECK(status IN ('PRESENT', 'ABSENT', 'LATE')) NOT NULL,
      marked_by_trainer_id INTEGER REFERENCES trainers(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, course_id, date)
    );

    -- Assessments
    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      trainer_id INTEGER NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      max_marks REAL NOT NULL DEFAULT 100,
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Assessment Results / Marks
    CREATE TABLE IF NOT EXISTS assessment_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      marks_obtained REAL NOT NULL,
      remarks TEXT,
      graded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(assessment_id, student_id)
    );

    -- Announcements
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      target_role TEXT CHECK(target_role IN ('ALL', 'STUDENT', 'TRAINER')) DEFAULT 'ALL',
      author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Helpful indexes for fast querying and filtering
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_student_course ON attendance(student_id, course_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
    CREATE INDEX IF NOT EXISTS idx_assessment_results_student ON assessment_results(student_id);
    CREATE INDEX IF NOT EXISTS idx_assessments_course ON assessments(course_id);
  `;

  db.exec(schemaSql);
  console.log('[Database] Schema initialized successfully.');
}

export default initializeDatabase;
