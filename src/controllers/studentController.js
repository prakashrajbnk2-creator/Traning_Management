import db from '../database/db.js';

export function getStudentDashboard(req, res) {
  try {
    const studentId = req.user.student_id;
    if (!studentId) {
      return res.status(403).json({
        success: false,
        message: 'No associated student profile found for this user.'
      });
    }

    // 1. Student Profile
    const profile = db.prepare(`
      SELECT s.id, s.student_code, s.phone, u.name, u.email, u.status
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(studentId);

    // 2. Enrolled Courses with Modules and Progress
    const courses = db.prepare(`
      SELECT c.id, c.code, c.title, c.description, e.status AS enrollment_status, e.enrolled_at
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
    `).all(studentId);

    let totalCompletedModulesAll = 0;
    let totalModulesAll = 0;

    const courseDetails = courses.map((course) => {
      // Get modules
      const totalModules = db.prepare('SELECT COUNT(*) as c FROM course_modules WHERE course_id = ?').get(course.id).c;
      const completedModules = db.prepare(`
        SELECT COUNT(*) as c
        FROM student_progress sp
        JOIN course_modules cm ON sp.module_id = cm.id
        WHERE sp.student_id = ? AND cm.course_id = ? AND sp.completed = 1
      `).get(studentId, course.id).c;

      totalModulesAll += totalModules;
      totalCompletedModulesAll += completedModules;

      const courseProgressPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

      // Get assigned trainers for this course
      const trainers = db.prepare(`
        SELECT u.name, t.trainer_code, t.specialization, u.email
        FROM trainer_assignments ta
        JOIN trainers t ON ta.trainer_id = t.id
        JOIN users u ON t.user_id = u.id
        WHERE ta.course_id = ?
      `).all(course.id);

      // Course-specific attendance
      const attStats = db.prepare(`
        SELECT 
          COUNT(*) as total_sessions,
          SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late_count,
          SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count
        FROM attendance
        WHERE student_id = ? AND course_id = ?
      `).get(studentId, course.id);

      const attendedSessions = (attStats.present_count || 0) + (attStats.late_count ? attStats.late_count * 0.5 : 0);
      const courseAttendancePct = attStats.total_sessions > 0
        ? Math.round((attendedSessions / attStats.total_sessions) * 100)
        : 100;

      return {
        id: course.id,
        code: course.code,
        title: course.title,
        description: course.description,
        status: course.enrollment_status,
        progressPercentage: courseProgressPct,
        completedModules,
        totalModules,
        attendancePercentage: courseAttendancePct,
        trainers
      };
    });

    // 3. Overall Progress
    const overallProgress = totalModulesAll > 0
      ? Math.round((totalCompletedModulesAll / totalModulesAll) * 100)
      : 0;

    // 4. Overall Attendance
    const overallAtt = db.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count
      FROM attendance
      WHERE student_id = ?
    `).get(studentId);

    const totalAttended = (overallAtt.present_count || 0) + (overallAtt.late_count ? overallAtt.late_count * 0.5 : 0);
    const overallAttendancePct = overallAtt.total_sessions > 0
      ? Math.round((totalAttended / overallAtt.total_sessions) * 100)
      : 100;

    // 5. Assessments & Marks
    const enrolledCourseIds = courses.map(c => c.id);
    let upcomingAssessments = [];
    let completedAssessments = [];
    let averageMarks = 0;

    if (enrolledCourseIds.length > 0) {
      const placeholders = enrolledCourseIds.map(() => '?').join(',');
      
      // All assessments in enrolled courses
      const allCourseAssessments = db.prepare(`
        SELECT a.id, a.title, a.description, a.max_marks, a.due_date, c.code as course_code, c.title as course_title,
               ar.marks_obtained, ar.remarks, ar.graded_at
        FROM assessments a
        JOIN courses c ON a.course_id = c.id
        LEFT JOIN assessment_results ar ON a.id = ar.assessment_id AND ar.student_id = ?
        WHERE a.course_id IN (${placeholders})
        ORDER BY a.due_date ASC
      `).all(studentId, ...enrolledCourseIds);

      completedAssessments = allCourseAssessments.filter(a => a.marks_obtained !== null).map(a => ({
        assessmentId: a.id,
        title: a.title,
        courseCode: a.course_code,
        courseTitle: a.course_title,
        maxMarks: a.max_marks,
        marksObtained: a.marks_obtained,
        percentage: Math.round((a.marks_obtained / a.max_marks) * 100),
        remarks: a.remarks,
        gradedAt: a.graded_at
      }));

      upcomingAssessments = allCourseAssessments.filter(a => a.marks_obtained === null).map(a => ({
        assessmentId: a.id,
        title: a.title,
        description: a.description,
        courseCode: a.course_code,
        courseTitle: a.course_title,
        maxMarks: a.max_marks,
        dueDate: a.due_date
      }));

      if (completedAssessments.length > 0) {
        const totalPct = completedAssessments.reduce((sum, item) => sum + item.percentage, 0);
        averageMarks = Math.round(totalPct / completedAssessments.length);
      }
    }

    // 6. Announcements
    const announcements = db.prepare(`
      SELECT id, title, content, created_at
      FROM announcements
      WHERE target_role IN ('ALL', 'STUDENT')
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    return res.status(200).json({
      success: true,
      dashboard: {
        student: {
          name: profile.name,
          studentId: profile.student_code,
          email: profile.email,
          phone: profile.phone
        },
        courses: courseDetails,
        overallAttendance: overallAttendancePct,
        averageMarks,
        upcomingAssessments,
        completedAssessments,
        overallProgress,
        announcements
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate student dashboard.',
      error: error.message
    });
  }
}

export function getStudentCourses(req, res) {
  try {
    const studentId = req.user.student_id;
    const courses = db.prepare(`
      SELECT c.id, c.code, c.title, c.description, e.status AS enrollment_status, e.enrolled_at
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
    `).all(studentId);

    const detailedCourses = courses.map(course => {
      const modules = db.prepare(`
        SELECT cm.id, cm.title, cm.description, cm.order_index,
               COALESCE(sp.completed, 0) AS completed, sp.completed_at
        FROM course_modules cm
        LEFT JOIN student_progress sp ON cm.id = sp.module_id AND sp.student_id = ?
        WHERE cm.course_id = ?
        ORDER BY cm.order_index ASC
      `).all(studentId, course.id);

      const trainers = db.prepare(`
        SELECT u.name, u.email, t.trainer_code, t.specialization
        FROM trainer_assignments ta
        JOIN trainers t ON ta.trainer_id = t.id
        JOIN users u ON t.user_id = u.id
        WHERE ta.course_id = ?
      `).all(course.id);

      return {
        ...course,
        modules,
        trainers
      };
    });

    res.status(200).json({ success: true, courses: detailedCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch courses.', error: error.message });
  }
}

export function markModuleComplete(req, res) {
  try {
    const studentId = req.user.student_id;
    const moduleId = parseInt(req.params.id, 10);

    // Verify student is enrolled in the course that contains this module
    const moduleInfo = db.prepare(`
      SELECT cm.id, cm.course_id
      FROM course_modules cm
      JOIN enrollments e ON cm.course_id = e.course_id
      WHERE cm.id = ? AND e.student_id = ?
    `).get(moduleId, studentId);

    if (!moduleInfo) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in the course for this module or module does not exist.'
      });
    }

    db.prepare(`
      INSERT INTO student_progress (student_id, module_id, completed, completed_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, module_id) DO UPDATE SET
        completed = 1,
        completed_at = CURRENT_TIMESTAMP
    `).run(studentId, moduleId);

    res.status(200).json({
      success: true,
      message: 'Module marked as completed successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update progress.', error: error.message });
  }
}

export function getStudentAttendance(req, res) {
  try {
    const studentId = req.user.student_id;
    const records = db.prepare(`
      SELECT a.id, a.date, a.status, c.code AS course_code, c.title AS course_title, u.name AS marked_by
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN trainers t ON a.marked_by_trainer_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE a.student_id = ?
      ORDER BY a.date DESC
    `).all(studentId);

    res.status(200).json({ success: true, attendance: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance.', error: error.message });
  }
}

export function getStudentAssessments(req, res) {
  try {
    const studentId = req.user.student_id;
    const results = db.prepare(`
      SELECT a.id, a.title, a.description, a.max_marks, a.due_date,
             c.code AS course_code, c.title AS course_title,
             ar.marks_obtained, ar.remarks, ar.graded_at
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN assessments a ON c.id = a.course_id
      LEFT JOIN assessment_results ar ON a.id = ar.assessment_id AND ar.student_id = ?
      WHERE e.student_id = ?
      ORDER BY a.due_date DESC
    `).all(studentId, studentId);

    res.status(200).json({ success: true, assessments: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assessments.', error: error.message });
  }
}
