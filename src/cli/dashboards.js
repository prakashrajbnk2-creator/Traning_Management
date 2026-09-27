// Dashboard rendering functions matching requirements

export function renderStudentDashboard(data) {
  const d = data.dashboard;
  const s = d.student;

  console.log(`
--------------------------------
Student Dashboard
--------------------------------

Name: ${s.name}
Student ID: ${s.studentId}

Courses:`);

  if (d.courses && d.courses.length > 0) {
    d.courses.forEach(c => {
      const codePadded = (c.code + ' - ' + c.title).padEnd(35);
      console.log(`${codePadded} ${c.progressPercentage}%`);
    });
  } else {
    console.log('No enrolled courses.');
  }

  console.log(`
Attendance:`);
  if (d.courses && d.courses.length > 0) {
    d.courses.forEach(c => {
      const titlePadded = (c.code + ' - ' + c.title).padEnd(35);
      console.log(`${titlePadded} ${c.attendancePercentage}%`);
    });
  } else {
    console.log('No attendance records.');
  }

  console.log(`
Average Marks:
${d.averageMarks}%

Upcoming Assessments:`);
  if (d.upcomingAssessments && d.upcomingAssessments.length > 0) {
    d.upcomingAssessments.forEach(a => {
      console.log(`- ${a.title} (${a.courseCode})${a.dueDate ? ' [Due: ' + a.dueDate + ']' : ''}`);
    });
  } else {
    console.log('- None');
  }

  console.log(`
Completed Assessments:`);
  if (d.completedAssessments && d.completedAssessments.length > 0) {
    d.completedAssessments.forEach(a => {
      console.log(`- ${a.title}: ${a.marksObtained}/${a.maxMarks} (${a.percentage}%)`);
    });
  } else {
    console.log('- None completed yet');
  }

  console.log(`
Overall Progress:
${d.overallProgress}%
--------------------------------`);

  if (d.announcements && d.announcements.length > 0) {
    console.log(`
📢 Announcements:`);
    d.announcements.forEach(ann => {
      console.log(`• [${ann.created_at.slice(0, 10)}] ${ann.title}: ${ann.content}`);
    });
  }
}

export function renderTrainerDashboard(data) {
  const d = data.dashboard;

  console.log(`
--------------------------------
Trainer Dashboard
--------------------------------

Trainer:
${d.trainer} (${d.trainerCode} - ${d.specialization})

Assigned Students: ${d.assignedStudents}
Courses: ${d.coursesCount}

Average Attendance: ${d.averageAttendance}%
Average Student Marks: ${d.averageStudentMarks}%

Students Needing Attention:`);

  if (d.studentsNeedingAttention && d.studentsNeedingAttention.length > 0) {
    d.studentsNeedingAttention.forEach(s => {
      console.log(`- ${s.name} (${s.studentCode}) -> ${s.reasons}`);
    });
  } else {
    console.log('- None! All students performing well.');
  }

  console.log(`
Recent Assessments:`);
  if (d.recentAssessments && d.recentAssessments.length > 0) {
    d.recentAssessments.forEach(a => {
      console.log(`- ${a.title} [${a.course_code}] | Submissions: ${a.submissions_count} | Due: ${a.due_date || 'N/A'}`);
    });
  } else {
    console.log('- No assessments created yet.');
  }

  console.log(`
Assigned Courses:`);
  if (d.courses && d.courses.length > 0) {
    d.courses.forEach(c => {
      console.log(`- [${c.code}] ${c.title}`);
    });
  }

  console.log(`--------------------------------`);
}

export function renderAdminDashboard(data) {
  const d = data.dashboard;

  console.log(`
--------------------------------
Admin Dashboard
--------------------------------

Students: ${d.totalStudents}
Trainers: ${d.totalTrainers}
Courses: ${d.totalCourses}

Active Students: ${d.activeStudents}
Active Trainers: ${d.activeTrainers}

Average Attendance: ${d.averageAttendance}%
Average Course Completion: ${d.averageCompletion}%

Trainer Workload:`);

  if (d.trainerWorkload && d.trainerWorkload.length > 0) {
    d.trainerWorkload.forEach(t => {
      console.log(`- ${t.trainer_name} (${t.trainer_code}): ${t.courses_assigned} course(s), ${t.students_taught} student(s) taught, ${t.assessments_created} assessment(s)`);
    });
  } else {
    console.log('- No trainers currently assigned.');
  }

  console.log(`--------------------------------`);
}
