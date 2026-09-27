import bcrypt from 'bcryptjs';
import db from '../database/db.js';

export function getAdminDashboard(req, res) {
  try {
    // 1. Total & Active counts
    const studentStats = db.prepare(`
      SELECT 
        COUNT(s.id) as total_students,
        SUM(CASE WHEN u.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_students
      FROM students s
      JOIN users u ON s.user_id = u.id
    `).get();

    const trainerStats = db.prepare(`
      SELECT 
        COUNT(t.id) as total_trainers,
        SUM(CASE WHEN u.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_trainers
      FROM trainers t
      JOIN users u ON t.user_id = u.id
    `).get();

    const courseStats = db.prepare(`
      SELECT 
        COUNT(*) as total_courses,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_courses
      FROM courses
    `).get();

    // 2. Average Attendance across all courses
    const attData = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'LATE' THEN 0.5 ELSE 0 END) as late_count
      FROM attendance
    `).get();

    const averageAttendance = attData.total > 0
      ? Math.round(((attData.present_count + attData.late_count) / attData.total) * 100)
      : 0;

    // 3. Average Course Completion across all enrollments
    const enrollments = db.prepare(`
      SELECT e.student_id, e.course_id
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.status = 'ACTIVE'
    `).all();

    let totalPctSum = 0;
    let countedEnrollments = 0;

    for (const e of enrollments) {
      const totalModules = db.prepare('SELECT COUNT(*) as c FROM course_modules WHERE course_id = ?').get(e.course_id).c;
      if (totalModules > 0) {
        const completed = db.prepare(`
          SELECT COUNT(*) as c
          FROM student_progress sp
          JOIN course_modules cm ON sp.module_id = cm.id
          WHERE sp.student_id = ? AND cm.course_id = ? AND sp.completed = 1
        `).get(e.student_id, e.course_id).c;
        totalPctSum += (completed / totalModules) * 100;
        countedEnrollments++;
      }
    }

    const averageCompletion = countedEnrollments > 0
      ? Math.round(totalPctSum / countedEnrollments)
      : 0;

    // 4. Trainer Workload
    const trainerWorkload = db.prepare(`
      SELECT 
        t.id as trainer_id, t.trainer_code, u.name as trainer_name, t.specialization,
        (SELECT COUNT(*) FROM trainer_assignments WHERE trainer_id = t.id) as courses_assigned,
        (
          SELECT COUNT(DISTINCT e.student_id)
          FROM trainer_assignments ta
          JOIN enrollments e ON ta.course_id = e.course_id
          WHERE ta.trainer_id = t.id
        ) as students_taught,
        (SELECT COUNT(*) FROM assessments WHERE trainer_id = t.id) as assessments_created
      FROM trainers t
      JOIN users u ON t.user_id = u.id
      ORDER BY students_taught DESC
    `).all();

    return res.status(200).json({
      success: true,
      dashboard: {
        totalStudents: studentStats.total_students,
        activeStudents: studentStats.active_students,
        totalTrainers: trainerStats.total_trainers,
        activeTrainers: trainerStats.active_trainers,
        totalCourses: courseStats.total_courses,
        activeCourses: courseStats.active_courses,
        averageAttendance,
        averageCompletion,
        trainerWorkload
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate admin dashboard.', error: error.message });
  }
}

export function getAdminReports(req, res) {
  try {
    // 1. Course-wise student numbers & average progress
    const courseReports = db.prepare(`
      SELECT 
        c.id, c.code, c.title, c.status,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_students,
        (SELECT COUNT(*) FROM trainer_assignments WHERE course_id = c.id) as assigned_trainers,
        (SELECT COUNT(*) FROM course_modules WHERE course_id = c.id) as total_modules
      FROM courses c
      ORDER BY c.code ASC
    `).all();

    // 2. Overall student performance distribution
    const performanceStats = db.prepare(`
      SELECT 
        COUNT(ar.id) as total_submissions,
        AVG((ar.marks_obtained / a.max_marks) * 100) as avg_marks_pct,
        MIN((ar.marks_obtained / a.max_marks) * 100) as min_marks_pct,
        MAX((ar.marks_obtained / a.max_marks) * 100) as max_marks_pct
      FROM assessment_results ar
      JOIN assessments a ON ar.assessment_id = a.id
    `).get();

    // 3. Attendance distribution
    const attendanceStats = db.prepare(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count
      FROM attendance
    `).get();

    // 4. Trainer workload
    const trainerWorkload = db.prepare(`
      SELECT 
        t.id, t.trainer_code, u.name, t.specialization,
        (SELECT COUNT(*) FROM trainer_assignments WHERE trainer_id = t.id) as courses_count,
        (
          SELECT COUNT(DISTINCT e.student_id)
          FROM trainer_assignments ta
          JOIN enrollments e ON ta.course_id = e.course_id
          WHERE ta.trainer_id = t.id
        ) as students_count
      FROM trainers t
      JOIN users u ON t.user_id = u.id
    `).all();

    res.status(200).json({
      success: true,
      reports: {
        courses: courseReports,
        performance: {
          totalSubmissions: performanceStats.total_submissions,
          averageScorePct: performanceStats.avg_marks_pct ? Math.round(performanceStats.avg_marks_pct) : 0,
          minScorePct: performanceStats.min_marks_pct ? Math.round(performanceStats.min_marks_pct) : 0,
          maxScorePct: performanceStats.max_marks_pct ? Math.round(performanceStats.max_marks_pct) : 0
        },
        attendance: attendanceStats,
        trainerWorkload
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate reports.', error: error.message });
  }
}

// ==================== STUDENTS CRUD ====================
export function getAllStudents(req, res) {
  try {
    const { search, status, sortBy = 'name', order = 'ASC', page = 1, limit = 50 } = req.query;
    let query = `
      SELECT s.id, s.student_code, s.phone, s.created_at,
             u.id as user_id, u.name, u.email, u.status
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR s.student_code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      query += ` AND u.status = ?`;
      params.push(status.toUpperCase());
    }

    const validSortCols = { name: 'u.name', email: 'u.email', code: 's.student_code', created_at: 's.created_at' };
    const sortCol = validSortCols[sortBy] || 'u.name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
    const totalCount = db.prepare(countQuery).get(...params).total;

    query += ` ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`;
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 50);
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const offset = (parsedPage - 1) * parsedLimit;
    params.push(parsedLimit, offset);

    const students = db.prepare(query).all(...params);

    const enriched = students.map(s => {
      const courses = db.prepare(`
        SELECT c.id, c.code, c.title
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = ?
      `).all(s.id);
      return { ...s, enrolledCourses: courses };
    });

    res.status(200).json({
      success: true,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / parsedLimit)
      },
      students: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch students.', error: error.message });
  }
}

export function createStudent(req, res) {
  try {
    const { name, email, password, student_code, phone } = req.body;
    if (!name || !email || !password || !student_code) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and student_code are required.' });
    }

    // Check email uniqueness
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email address already in use.' });
    }

    // Check code uniqueness
    const existingCode = db.prepare('SELECT id FROM students WHERE student_code = ?').get(student_code.trim().toUpperCase());
    if (existingCode) {
      return res.status(409).json({ success: false, message: 'Student code already in use.' });
    }

    const hash = bcrypt.hashSync(password, 10);

    const insertTransaction = db.transaction(() => {
      const userResult = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, status)
        VALUES (?, ?, ?, 'STUDENT', 'ACTIVE')
      `).run(name.trim(), email.trim().toLowerCase(), hash);

      const studentResult = db.prepare(`
        INSERT INTO students (user_id, student_code, phone)
        VALUES (?, ?, ?)
      `).run(userResult.lastInsertRowid, student_code.trim().toUpperCase(), phone || null);

      return { userId: userResult.lastInsertRowid, studentId: studentResult.lastInsertRowid };
    });

    const ids = insertTransaction();
    res.status(201).json({
      success: true,
      message: 'Student created successfully.',
      ...ids
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create student.', error: error.message });
  }
}

export function updateStudent(req, res) {
  try {
    const studentId = parseInt(req.params.id, 10);
    const { name, phone, status, password } = req.body;

    const student = db.prepare('SELECT id, user_id FROM students WHERE id = ?').get(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const updateTx = db.transaction(() => {
      if (name || status || password) {
        let sql = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        if (name) { sql += ', name = ?'; params.push(name.trim()); }
        if (status) { sql += ', status = ?'; params.push(status.toUpperCase()); }
        if (password) {
          sql += ', password_hash = ?';
          params.push(bcrypt.hashSync(password, 10));
        }
        sql += ' WHERE id = ?';
        params.push(student.user_id);
        db.prepare(sql).run(...params);
      }

      if (phone !== undefined) {
        db.prepare('UPDATE students SET phone = ? WHERE id = ?').run(phone, studentId);
      }
    });

    updateTx();
    res.status(200).json({ success: true, message: 'Student updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update student.', error: error.message });
  }
}

export function deleteStudent(req, res) {
  try {
    const studentId = parseInt(req.params.id, 10);
    const student = db.prepare('SELECT user_id FROM students WHERE id = ?').get(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Cascade delete via users table
    db.prepare('DELETE FROM users WHERE id = ?').run(student.user_id);
    res.status(200).json({ success: true, message: 'Student and related records deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete student.', error: error.message });
  }
}

// ==================== TRAINERS CRUD ====================
export function getAllTrainers(req, res) {
  try {
    const trainers = db.prepare(`
      SELECT t.id, t.trainer_code, t.specialization, t.phone, t.created_at,
             u.id as user_id, u.name, u.email, u.status,
             (SELECT COUNT(*) FROM trainer_assignments WHERE trainer_id = t.id) as assigned_courses_count
      FROM trainers t
      JOIN users u ON t.user_id = u.id
      ORDER BY u.name ASC
    `).all();

    res.status(200).json({ success: true, trainers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trainers.', error: error.message });
  }
}

export function createTrainer(req, res) {
  try {
    const { name, email, password, trainer_code, specialization, phone } = req.body;
    if (!name || !email || !password || !trainer_code) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and trainer_code are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email address already in use.' });
    }

    const existingCode = db.prepare('SELECT id FROM trainers WHERE trainer_code = ?').get(trainer_code.trim().toUpperCase());
    if (existingCode) {
      return res.status(409).json({ success: false, message: 'Trainer code already in use.' });
    }

    const hash = bcrypt.hashSync(password, 10);

    const insertTx = db.transaction(() => {
      const userRes = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, status)
        VALUES (?, ?, ?, 'TRAINER', 'ACTIVE')
      `).run(name.trim(), email.trim().toLowerCase(), hash);

      const trainerRes = db.prepare(`
        INSERT INTO trainers (user_id, trainer_code, specialization, phone)
        VALUES (?, ?, ?, ?)
      `).run(userRes.lastInsertRowid, trainer_code.trim().toUpperCase(), specialization || '', phone || null);

      return { userId: userRes.lastInsertRowid, trainerId: trainerRes.lastInsertRowid };
    });

    const ids = insertTx();
    res.status(201).json({ success: true, message: 'Trainer created successfully.', ...ids });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create trainer.', error: error.message });
  }
}

export function updateTrainer(req, res) {
  try {
    const trainerId = parseInt(req.params.id, 10);
    const { name, specialization, phone, status, password } = req.body;

    const trainer = db.prepare('SELECT id, user_id FROM trainers WHERE id = ?').get(trainerId);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }

    const updateTx = db.transaction(() => {
      if (name || status || password) {
        let sql = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        if (name) { sql += ', name = ?'; params.push(name.trim()); }
        if (status) { sql += ', status = ?'; params.push(status.toUpperCase()); }
        if (password) {
          sql += ', password_hash = ?';
          params.push(bcrypt.hashSync(password, 10));
        }
        sql += ' WHERE id = ?';
        params.push(trainer.user_id);
        db.prepare(sql).run(...params);
      }

      if (specialization !== undefined || phone !== undefined) {
        let sql = 'UPDATE trainers SET ';
        const clauses = [];
        const params = [];
        if (specialization !== undefined) { clauses.push('specialization = ?'); params.push(specialization); }
        if (phone !== undefined) { clauses.push('phone = ?'); params.push(phone); }
        sql += clauses.join(', ') + ' WHERE id = ?';
        params.push(trainerId);
        db.prepare(sql).run(...params);
      }
    });

    updateTx();
    res.status(200).json({ success: true, message: 'Trainer updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update trainer.', error: error.message });
  }
}

export function deleteTrainer(req, res) {
  try {
    const trainerId = parseInt(req.params.id, 10);
    const trainer = db.prepare('SELECT user_id FROM trainers WHERE id = ?').get(trainerId);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(trainer.user_id);
    res.status(200).json({ success: true, message: 'Trainer and associated profile removed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete trainer.', error: error.message });
  }
}

// ==================== COURSES CRUD ====================
export function getAllCourses(req, res) {
  try {
    const courses = db.prepare(`
      SELECT 
        c.id, c.code, c.title, c.description, c.status, c.created_at,
        (SELECT COUNT(*) FROM course_modules WHERE course_id = c.id) as modules_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as students_count,
        (SELECT COUNT(*) FROM trainer_assignments WHERE course_id = c.id) as trainers_count
      FROM courses c
      ORDER BY c.code ASC
    `).all();

    res.status(200).json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch courses.', error: error.message });
  }
}

export function createCourse(req, res) {
  try {
    const { code, title, description, modules } = req.body;
    if (!code || !title) {
      return res.status(400).json({ success: false, message: 'Course code and title are required.' });
    }

    const existing = db.prepare('SELECT id FROM courses WHERE code = ?').get(code.trim().toUpperCase());
    if (existing) {
      return res.status(409).json({ success: false, message: 'Course code already exists.' });
    }

    const insertTx = db.transaction(() => {
      const courseRes = db.prepare(`
        INSERT INTO courses (code, title, description, status)
        VALUES (?, ?, ?, 'ACTIVE')
      `).run(code.trim().toUpperCase(), title.trim(), description || '');

      const courseId = courseRes.lastInsertRowid;

      if (Array.isArray(modules)) {
        const insertModule = db.prepare(`
          INSERT INTO course_modules (course_id, title, description, order_index)
          VALUES (?, ?, ?, ?)
        `);
        modules.forEach((mod, idx) => {
          insertModule.run(courseId, mod.title || `Module ${idx + 1}`, mod.description || '', idx + 1);
        });
      }

      return courseId;
    });

    const courseId = insertTx();
    res.status(201).json({ success: true, message: 'Course created successfully.', courseId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create course.', error: error.message });
  }
}

export function updateCourse(req, res) {
  try {
    const courseId = parseInt(req.params.id, 10);
    const { title, description, status } = req.body;

    let sql = 'UPDATE courses SET ';
    const clauses = [];
    const params = [];
    if (title) { clauses.push('title = ?'); params.push(title.trim()); }
    if (description !== undefined) { clauses.push('description = ?'); params.push(description); }
    if (status) { clauses.push('status = ?'); params.push(status.toUpperCase()); }

    if (clauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided for update.' });
    }

    sql += clauses.join(', ') + ' WHERE id = ?';
    params.push(courseId);

    db.prepare(sql).run(...params);
    res.status(200).json({ success: true, message: 'Course updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update course.', error: error.message });
  }
}

export function deleteCourse(req, res) {
  try {
    const courseId = parseInt(req.params.id, 10);
    db.prepare('DELETE FROM courses WHERE id = ?').run(courseId);
    res.status(200).json({ success: true, message: 'Course deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete course.', error: error.message });
  }
}

// ==================== ASSIGNMENTS ====================
export function assignTrainerToCourse(req, res) {
  try {
    const { trainer_id, course_id } = req.body;
    if (!trainer_id || !course_id) {
      return res.status(400).json({ success: false, message: 'trainer_id and course_id are required.' });
    }

    db.prepare(`
      INSERT INTO trainer_assignments (trainer_id, course_id)
      VALUES (?, ?)
      ON CONFLICT(trainer_id, course_id) DO NOTHING
    `).run(trainer_id, course_id);

    res.status(200).json({ success: true, message: 'Trainer assigned to course successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to assign trainer to course.', error: error.message });
  }
}

export function unassignTrainerFromCourse(req, res) {
  try {
    const { trainer_id, course_id } = req.body;
    db.prepare('DELETE FROM trainer_assignments WHERE trainer_id = ? AND course_id = ?').run(trainer_id, course_id);
    res.status(200).json({ success: true, message: 'Trainer unassigned from course successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unassign trainer.', error: error.message });
  }
}

export function enrollStudentInCourse(req, res) {
  try {
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id) {
      return res.status(400).json({ success: false, message: 'student_id and course_id are required.' });
    }

    db.prepare(`
      INSERT INTO enrollments (student_id, course_id, status)
      VALUES (?, ?, 'ACTIVE')
      ON CONFLICT(student_id, course_id) DO UPDATE SET status = 'ACTIVE'
    `).run(student_id, course_id);

    res.status(200).json({ success: true, message: 'Student enrolled in course successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to enroll student.', error: error.message });
  }
}

export function unenrollStudentFromCourse(req, res) {
  try {
    const { student_id, course_id } = req.body;
    db.prepare('DELETE FROM enrollments WHERE student_id = ? AND course_id = ?').run(student_id, course_id);
    res.status(200).json({ success: true, message: 'Student unenrolled from course successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unenroll student.', error: error.message });
  }
}

// ==================== SYSTEM-WIDE ATTENDANCE & ASSESSMENTS ====================
export function getAllAttendance(req, res) {
  try {
    const { student_id, trainer_id, course_id, date } = req.query;
    let query = `
      SELECT a.id, a.date, a.status, a.created_at,
             s.id as student_id, s.student_code, su.name as student_name,
             c.id as course_id, c.code as course_code, c.title as course_title,
             tu.name as marked_by_trainer
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN users su ON s.user_id = su.id
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN trainers t ON a.marked_by_trainer_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) { query += ' AND a.student_id = ?'; params.push(student_id); }
    if (trainer_id) { query += ' AND a.marked_by_trainer_id = ?'; params.push(trainer_id); }
    if (course_id) { query += ' AND a.course_id = ?'; params.push(course_id); }
    if (date) { query += ' AND a.date = ?'; params.push(date); }

    query += ' ORDER BY a.date DESC, su.name ASC';
    const records = db.prepare(query).all(...params);

    res.status(200).json({ success: true, attendance: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance.', error: error.message });
  }
}

export function getAllAssessments(req, res) {
  try {
    const { course_id, trainer_id } = req.query;
    let query = `
      SELECT a.id, a.title, a.description, a.max_marks, a.due_date, a.created_at,
             c.code as course_code, c.title as course_title,
             u.name as trainer_name,
             COUNT(ar.id) as submissions_count,
             AVG(ar.marks_obtained) as avg_marks_obtained
      FROM assessments a
      JOIN courses c ON a.course_id = c.id
      JOIN trainers t ON a.trainer_id = t.id
      JOIN users u ON t.user_id = u.id
      LEFT JOIN assessment_results ar ON a.id = ar.assessment_id
      WHERE 1=1
    `;
    const params = [];

    if (course_id) { query += ' AND a.course_id = ?'; params.push(course_id); }
    if (trainer_id) { query += ' AND a.trainer_id = ?'; params.push(trainer_id); }

    query += ' GROUP BY a.id ORDER BY a.created_at DESC';
    const assessments = db.prepare(query).all(...params);

    res.status(200).json({ success: true, assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assessments.', error: error.message });
  }
}

// ==================== ANNOUNCEMENTS ====================
export function getAllAnnouncements(req, res) {
  try {
    const announcements = db.prepare(`
      SELECT a.id, a.title, a.content, a.target_role, a.created_at, u.name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
    `).all();

    res.status(200).json({ success: true, announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcements.', error: error.message });
  }
}

export function createAnnouncement(req, res) {
  try {
    const { title, content, target_role } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const result = db.prepare(`
      INSERT INTO announcements (title, content, target_role, author_id)
      VALUES (?, ?, ?, ?)
    `).run(title, content, target_role || 'ALL', req.user.id);

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      announcementId: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create announcement.', error: error.message });
  }
}
