import db from '../database/db.js';

// Helper to get trainer's assigned course IDs
function getTrainerCourseIds(trainerId) {
  const rows = db.prepare('SELECT course_id FROM trainer_assignments WHERE trainer_id = ?').all(trainerId);
  return rows.map(r => r.course_id);
}

export function getTrainerDashboard(req, res) {
  try {
    const trainerId = req.user.trainer_id;
    if (!trainerId) {
      return res.status(403).json({ success: false, message: 'Trainer profile not found.' });
    }

    const trainerProfile = db.prepare(`
      SELECT t.id, t.trainer_code, t.specialization, u.name, u.email
      FROM trainers t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(trainerId);

    const courseIds = getTrainerCourseIds(trainerId);
    if (courseIds.length === 0) {
      return res.status(200).json({
        success: true,
        dashboard: {
          trainer: trainerProfile.name,
          trainerCode: trainerProfile.trainer_code,
          specialization: trainerProfile.specialization,
          assignedStudents: 0,
          coursesCount: 0,
          averageAttendance: 0,
          averageStudentMarks: 0,
          studentsNeedingAttention: [],
          recentAssessments: [],
          courses: []
        }
      });
    }

    const placeholders = courseIds.map(() => '?').join(',');

    // Assigned courses
    const courses = db.prepare(`
      SELECT id, code, title, description
      FROM courses
      WHERE id IN (${placeholders})
    `).all(...courseIds);

    // Count of distinct students in trainer's courses
    const studentCount = db.prepare(`
      SELECT COUNT(DISTINCT student_id) as count
      FROM enrollments
      WHERE course_id IN (${placeholders})
    `).get(...courseIds).count;

    // Average attendance in trainer's courses
    const attData = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'LATE' THEN 0.5 ELSE 0 END) as late_count
      FROM attendance
      WHERE course_id IN (${placeholders})
    `).get(...courseIds);

    const avgAttendance = attData.total > 0
      ? Math.round(((attData.present_count + attData.late_count) / attData.total) * 100)
      : 0;

    // Average student marks across assessments for trainer's courses
    const marksData = db.prepare(`
      SELECT 
        AVG((ar.marks_obtained / a.max_marks) * 100) as avg_pct
      FROM assessment_results ar
      JOIN assessments a ON ar.assessment_id = a.id
      WHERE a.course_id IN (${placeholders})
    `).get(...courseIds);

    const avgMarks = marksData.avg_pct ? Math.round(marksData.avg_pct) : 0;

    // Students needing attention: attendance < 75% or average marks < 60%
    const assignedStudents = db.prepare(`
      SELECT DISTINCT s.id, s.student_code, u.name, u.email
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE e.course_id IN (${placeholders})
    `).all(...courseIds);

    const studentsNeedingAttention = [];

    for (const student of assignedStudents) {
      // Check attendance
      const sAtt = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN status = 'LATE' THEN 0.5 ELSE 0 END) as late_count
        FROM attendance
        WHERE student_id = ? AND course_id IN (${placeholders})
      `).get(student.id, ...courseIds);

      const sAttPct = sAtt.total > 0 ? Math.round(((sAtt.present_count + sAtt.late_count) / sAtt.total) * 100) : 100;

      // Check marks
      const sMarks = db.prepare(`
        SELECT AVG((ar.marks_obtained / a.max_marks) * 100) as avg_pct
        FROM assessment_results ar
        JOIN assessments a ON ar.assessment_id = a.id
        WHERE ar.student_id = ? AND a.course_id IN (${placeholders})
      `).get(student.id, ...courseIds);

      const sMarksPct = sMarks.avg_pct !== null ? Math.round(sMarks.avg_pct) : null;

      const reasons = [];
      if (sAtt.total > 0 && sAttPct < 75) {
        reasons.push(`Low attendance (${sAttPct}%)`);
      }
      if (sMarksPct !== null && sMarksPct < 60) {
        reasons.push(`Low assessment average (${sMarksPct}%)`);
      }

      if (reasons.length > 0) {
        studentsNeedingAttention.push({
          studentId: student.id,
          name: student.name,
          studentCode: student.student_code,
          attendancePct: sAttPct,
          marksPct: sMarksPct,
          reasons: reasons.join(', ')
        });
      }
    }

    // Recent Assessments
    const recentAssessments = db.prepare(`
      SELECT a.id, a.title, a.due_date, a.max_marks, c.code as course_code, c.title as course_title,
             COUNT(ar.id) as submissions_count
      FROM assessments a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN assessment_results ar ON a.id = ar.assessment_id
      WHERE a.course_id IN (${placeholders})
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `).all(...courseIds);

    return res.status(200).json({
      success: true,
      dashboard: {
        trainer: trainerProfile.name,
        trainerCode: trainerProfile.trainer_code,
        specialization: trainerProfile.specialization,
        assignedStudents: studentCount,
        coursesCount: courses.length,
        averageAttendance: avgAttendance,
        averageStudentMarks: avgMarks,
        studentsNeedingAttention,
        recentAssessments,
        courses
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate trainer dashboard.', error: error.message });
  }
}

export function getTrainerCourses(req, res) {
  try {
    const trainerId = req.user.trainer_id;
    const courses = db.prepare(`
      SELECT c.id, c.code, c.title, c.description, c.status
      FROM trainer_assignments ta
      JOIN courses c ON ta.course_id = c.id
      WHERE ta.trainer_id = ?
    `).all(trainerId);

    res.status(200).json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trainer courses.', error: error.message });
  }
}

export function getTrainerStudents(req, res) {
  try {
    const trainerId = req.user.trainer_id;
    const courseIds = getTrainerCourseIds(trainerId);
    if (courseIds.length === 0) {
      return res.status(200).json({ success: true, students: [] });
    }

    const placeholders = courseIds.map(() => '?').join(',');
    const students = db.prepare(`
      SELECT DISTINCT s.id, s.student_code, s.phone, u.name, u.email, u.status
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE e.course_id IN (${placeholders})
      ORDER BY u.name ASC
    `).all(...courseIds);

    // Enrich each student with course enrollment list, attendance, and average marks
    const enriched = students.map(student => {
      const studentCourses = db.prepare(`
        SELECT c.id, c.code, c.title
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = ? AND e.course_id IN (${placeholders})
      `).all(student.id, ...courseIds);

      const att = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN status = 'LATE' THEN 0.5 ELSE 0 END) as late_count
        FROM attendance
        WHERE student_id = ? AND course_id IN (${placeholders})
      `).get(student.id, ...courseIds);

      const attPct = att.total > 0 ? Math.round(((att.present_count + att.late_count) / att.total) * 100) : 100;

      const marks = db.prepare(`
        SELECT AVG((ar.marks_obtained / a.max_marks) * 100) as avg_pct
        FROM assessment_results ar
        JOIN assessments a ON ar.assessment_id = a.id
        WHERE ar.student_id = ? AND a.course_id IN (${placeholders})
      `).get(student.id, ...courseIds);

      return {
        ...student,
        enrolledCourses: studentCourses,
        attendancePercentage: attPct,
        averageMarks: marks.avg_pct !== null ? Math.round(marks.avg_pct) : null
      };
    });

    res.status(200).json({ success: true, students: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch students.', error: error.message });
  }
}

export function getStudentProfileForTrainer(req, res) {
  try {
    const trainerId = req.user.trainer_id;
    const studentId = parseInt(req.params.id, 10);
    const courseIds = getTrainerCourseIds(trainerId);

    // Verify student is enrolled in at least one of this trainer's courses
    if (courseIds.length === 0) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this student.' });
    }
    const placeholders = courseIds.map(() => '?').join(',');

    const isEnrolled = db.prepare(`
      SELECT COUNT(*) as c
      FROM enrollments
      WHERE student_id = ? AND course_id IN (${placeholders})
    `).get(studentId, ...courseIds).c;

    if (isEnrolled === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view students enrolled in your assigned courses.'
      });
    }

    const student = db.prepare(`
      SELECT s.id, s.student_code, s.phone, u.name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(studentId);

    // Progress in trainer's courses
    const courses = db.prepare(`
      SELECT c.id, c.code, c.title
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ? AND c.id IN (${placeholders})
    `).all(studentId, ...courseIds);

    const progress = courses.map(course => {
      const totalModules = db.prepare('SELECT COUNT(*) as c FROM course_modules WHERE course_id = ?').get(course.id).c;
      const completedModules = db.prepare(`
        SELECT COUNT(*) as c
        FROM student_progress sp
        JOIN course_modules cm ON sp.module_id = cm.id
        WHERE sp.student_id = ? AND cm.course_id = ? AND sp.completed = 1
      `).get(studentId, course.id).c;

      const modulesList = db.prepare(`
        SELECT cm.id, cm.title, cm.order_index, COALESCE(sp.completed, 0) as completed
        FROM course_modules cm
        LEFT JOIN student_progress sp ON cm.id = sp.module_id AND sp.student_id = ?
        WHERE cm.course_id = ?
        ORDER BY cm.order_index ASC
      `).all(studentId, course.id);

      return {
        courseId: course.id,
        courseCode: course.code,
        courseTitle: course.title,
        totalModules,
        completedModules,
        remainingModules: totalModules - completedModules,
        percentage: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
        modules: modulesList
      };
    });

    // Attendance
    const attendance = db.prepare(`
      SELECT a.id, a.date, a.status, c.code as course_code, c.title as course_title
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      WHERE a.student_id = ? AND a.course_id IN (${placeholders})
      ORDER BY a.date DESC
    `).all(studentId, ...courseIds);

    // Marks
    const marks = db.prepare(`
      SELECT a.id as assessment_id, a.title, a.max_marks, ar.marks_obtained, ar.remarks, ar.graded_at,
             c.code as course_code
      FROM assessments a
      JOIN courses c ON a.course_id = c.id
      JOIN assessment_results ar ON a.id = ar.assessment_id
      WHERE ar.student_id = ? AND a.course_id IN (${placeholders})
    `).all(studentId, ...courseIds);

    res.status(200).json({
      success: true,
      student: {
        ...student,
        progress,
        attendance,
        marks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student profile.', error: error.message });
  }
}

export function getAttendance(req, res) {
  try {
    const trainerId = req.user.trainer_id;
    const courseIds = getTrainerCourseIds(trainerId);
    if (courseIds.length === 0) {
      return res.status(200).json({ success: true, attendance: [] });
    }

    const { course_id, student_id, date } = req.query;
    let query = `
      SELECT a.id, a.date, a.status, a.course_id, a.student_id,
             u.name as student_name, s.student_code, c.code as course_code, c.title as course_title
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN courses c ON a.course_id = c.id
      WHERE a.course_id IN (${courseIds.map(() => '?').join(',')})
    `;
    const params = [...courseIds];

    if (course_id) {
      query += ` AND a.course_id = ?`;
      params.push(course_id);
    }
    if (student_id) {
      query += ` AND a.student_id = ?`;
      params.push(student_id);
    }
    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    }

    query += ` ORDER BY a.date DESC, u.name ASC`;
    const records = db.prepare(query).all(...params);

    res.status(200).json({ success: true, attendance: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to query attendance.', error: error.message });
  }
}

export function markAttendance(req, res) {
  try {
    const trainerId = req.user.trainer_id;
    const { student_id, course_id, date, status } = req.body;

    if (!student_id || !course_id || !date || !status) {
      return res.status(400).json({ success: false, message: 'All fields (student_id, course_id, date, status) are required.' });
    }

    if (!['PRESENT', 'ABSENT', 'LATE'].includes(status.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Status must be PRESENT, ABSENT, or LATE.' });
    }

    // Verify trainer is assigned to this course
    const isAssigned = db.prepare(`
      SELECT COUNT(*) as c FROM trainer_assignments WHERE trainer_id = ? AND course_id = ?
    `).get(trainerId, course_id).c;

    if (isAssigned === 0) {
      return res.status(403).json({ success: false, message: 'You are not assigned to instruct this course.' });
    }

    // Verify student is enrolled in this course
    const isEnrolled = db.prepare(`
      SELECT COUNT(*) as c FROM enrollments WHERE student_id = ? AND course_id = ?
    `).get(student_id, course_id).c;

    if (isEnrolled === 0) {
      return res.status(400).json({ success: false, message: 'Student is not enrolled in this course.' });
    }

    const insertOrUpdate = db.prepare(`
      INSERT INTO attendance (student_id, course_id, date, status, marked_by_trainer_id)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(student_id, course_id, date) DO UPDATE SET
        status = excluded.status,
        marked_by_trainer_id = excluded.marked_by_trainer_id
    `);

    insertOrUpdate.run(student_id, course_id, date, status.toUpperCase(), trainerId);

    res.status(200).json({ success: true, message: `Attendance marked as ${status.toUpperCase()} for ${date}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record attendance.', error: error.message });
  }
}

export function updateAttendance(req, res) {
  try {
    const trainerId = req.user.trainer_id;
    const attendanceId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!status || !['PRESENT', 'ABSENT', 'LATE'].includes(status.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Valid status (PRESENT, ABSENT, LATE) is required.' });
    }

    // Verify attendance belongs to a course the trainer teaches
    const record = db.prepare(`
      SELECT a.id, a.course_id
      FROM attendance a
      JOIN trainer_assignments ta ON a.course_id = ta.course_id
      WHERE a.id = ? AND ta.trainer_id = ?
    `).get(attendanceId, trainerId);

    if (!record) {
      return res.status(403).json({ success: false, message: 'Cannot modify attendance record for an unassigned course.' });
    }

    db.prepare(`
      UPDATE attendance
      SET status = ?, marked_by_trainer_id = ?
      WHERE id = ?
    `).run(status.toUpperCase(), trainerId, attendanceId);

    res.status(200).json({ success: true, message: 'Attendance record updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update attendance.', error: error.message });
  }
}

export function getTrainerAssessments(req, res) {
  try {
    const trainerId = req.user.trainer_id;
    const courseIds = getTrainerCourseIds(trainerId);
    if (courseIds.length === 0) {
      return res.status(200).json({ success: true, assessments: [] });
    }

    const placeholders = courseIds.map(() => '?').join(',');
    const assessments = db.prepare(`
      SELECT a.id, a.course_id, a.title, a.description, a.max_marks, a.due_date, a.created_at,
             c.code as course_code, c.title as course_title,
             COUNT(ar.id) as submissions_count,
             AVG(ar.marks_obtained) as avg_marks_obtained
      FROM assessments a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN assessment_results ar ON a.id = ar.assessment_id
      WHERE a.course_id IN (${placeholders})
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `).all(...courseIds);

    res.status(200).json({ success: true, assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assessments.', error: error.message });
  }
}

export function createAssessment(req, res) {
  try {
    const trainerId = req.user.trainer_id;
    const { course_id, title, description, max_marks, due_date } = req.body;

    if (!course_id || !title) {
      return res.status(400).json({ success: false, message: 'Course ID and Assessment Title are required.' });
    }

    // Verify course belongs to trainer
    const isAssigned = db.prepare(`
      SELECT COUNT(*) as c FROM trainer_assignments WHERE trainer_id = ? AND course_id = ?
    `).get(trainerId, course_id).c;

    if (isAssigned === 0) {
      return res.status(403).json({ success: false, message: 'You are not assigned to instruct this course.' });
    }

    const result = db.prepare(`
      INSERT INTO assessments (course_id, trainer_id, title, description, max_marks, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(course_id, trainerId, title, description || '', max_marks || 100, due_date || null);

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully.',
      assessmentId: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create assessment.', error: error.message });
  }
}

export function getAssessmentResults(req, res) {
  try {
    const trainerId = req.user.trainer_id;
    const assessmentId = parseInt(req.params.id, 10);

    const assessment = db.prepare(`
      SELECT a.id, a.title, a.max_marks, a.due_date, c.id as course_id, c.code as course_code, c.title as course_title
      FROM assessments a
      JOIN courses c ON a.course_id = c.id
      JOIN trainer_assignments ta ON c.id = ta.course_id
      WHERE a.id = ? AND ta.trainer_id = ?
    `).get(assessmentId, trainerId);

    if (!assessment) {
      return res.status(403).json({ success: false, message: 'Assessment not found or not in your assigned courses.' });
    }

    // Get all enrolled students in the course
    const students = db.prepare(`
      SELECT s.id as student_id, s.student_code, u.name, u.email,
             ar.id as result_id, ar.marks_obtained, ar.remarks, ar.graded_at
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN assessment_results ar ON s.id = ar.student_id AND ar.assessment_id = ?
      WHERE e.course_id = ?
      ORDER BY u.name ASC
    `).all(assessmentId, assessment.course_id);

    res.status(200).json({
      success: true,
      assessment,
      students
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assessment results.', error: error.message });
  }
}

export function enterMarks(req, res) {
  try {
    const trainerId = req.user.trainer_id;
    const assessmentId = parseInt(req.params.id, 10);
    const { student_id, marks_obtained, remarks } = req.body;

    if (!student_id || marks_obtained === undefined) {
      return res.status(400).json({ success: false, message: 'Student ID and marks_obtained are required.' });
    }

    // Verify assessment belongs to trainer's course
    const assessment = db.prepare(`
      SELECT a.id, a.max_marks, a.course_id
      FROM assessments a
      JOIN trainer_assignments ta ON a.course_id = ta.course_id
      WHERE a.id = ? AND ta.trainer_id = ?
    `).get(assessmentId, trainerId);

    if (!assessment) {
      return res.status(403).json({ success: false, message: 'Assessment not found or access denied.' });
    }

    const marksNum = parseFloat(marks_obtained);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > assessment.max_marks) {
      return res.status(400).json({
        success: false,
        message: `Marks obtained must be between 0 and maximum marks (${assessment.max_marks}).`
      });
    }

    // Verify student is enrolled in the course
    const isEnrolled = db.prepare(`
      SELECT COUNT(*) as c FROM enrollments WHERE student_id = ? AND course_id = ?
    `).get(student_id, assessment.course_id).c;

    if (isEnrolled === 0) {
      return res.status(400).json({ success: false, message: 'Student is not enrolled in this assessment\'s course.' });
    }

    db.prepare(`
      INSERT INTO assessment_results (assessment_id, student_id, marks_obtained, remarks, graded_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(assessment_id, student_id) DO UPDATE SET
        marks_obtained = excluded.marks_obtained,
        remarks = excluded.remarks,
        graded_at = CURRENT_TIMESTAMP
    `).run(assessmentId, student_id, marksNum, remarks || null);

    res.status(200).json({
      success: true,
      message: `Marks recorded successfully for student ID ${student_id} (${marksNum}/${assessment.max_marks}).`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to enter marks.', error: error.message });
  }
}

export function getTrainerProgress(req, res) {
  try {
    const trainerId = req.user.trainer_id;
    const courseIds = getTrainerCourseIds(trainerId);
    if (courseIds.length === 0) {
      return res.status(200).json({ success: true, progress: [] });
    }

    const placeholders = courseIds.map(() => '?').join(',');
    const results = db.prepare(`
      SELECT 
        c.id as course_id, c.code as course_code, c.title as course_title,
        s.id as student_id, s.student_code, u.name as student_name,
        (SELECT COUNT(*) FROM course_modules WHERE course_id = c.id) as total_modules,
        (
          SELECT COUNT(*)
          FROM student_progress sp
          JOIN course_modules cm ON sp.module_id = cm.id
          WHERE sp.student_id = s.id AND cm.course_id = c.id AND sp.completed = 1
        ) as completed_modules
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN students s ON e.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE c.id IN (${placeholders})
      ORDER BY c.code ASC, u.name ASC
    `).all(...courseIds);

    const progress = results.map(row => ({
      courseId: row.course_id,
      courseCode: row.course_code,
      courseTitle: row.course_title,
      studentId: row.student_id,
      studentCode: row.student_code,
      studentName: row.student_name,
      totalModules: row.total_modules,
      completedModules: row.completed_modules,
      remainingModules: row.total_modules - row.completed_modules,
      completionPercentage: row.total_modules > 0 ? Math.round((row.completed_modules / row.total_modules) * 100) : 0
    }));

    res.status(200).json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch progress overview.', error: error.message });
  }
}
