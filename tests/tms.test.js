import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { seedDatabase } from '../src/database/seed.js';

let server;
let baseUrl;

let adminToken = '';
let trainerToken = '';
let studentToken = '';

before(async () => {
  seedDatabase();
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

// Helper for making API requests
async function api(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

describe('1. Authentication Tests', () => {
  test('Admin Login with valid credentials', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@tms.com', password: 'Admin@123' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.user.role, 'ADMIN');
    assert.ok(res.data.token);
    assert.equal(res.data.dashboardRoute, '/api/admin/dashboard');
    adminToken = res.data.token;
  });

  test('Trainer Login with valid credentials', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'john@tms.com', password: 'Trainer@123' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.user.role, 'TRAINER');
    assert.ok(res.data.token);
    assert.equal(res.data.dashboardRoute, '/api/trainer/dashboard');
    trainerToken = res.data.token;
  });

  test('Student Login with valid credentials', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'alice@tms.com', password: 'Student@123' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.user.role, 'STUDENT');
    assert.ok(res.data.token);
    assert.equal(res.data.dashboardRoute, '/api/student/dashboard');
    studentToken = res.data.token;
  });

  test('Invalid Login - wrong password', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@tms.com', password: 'WrongPassword999' }
    });
    assert.equal(res.status, 401);
    assert.equal(res.data.success, false);
  });

  test('Invalid Login - non-existent email', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'nonexistent@tms.com', password: 'Password123' }
    });
    assert.equal(res.status, 401);
    assert.equal(res.data.success, false);
  });

  test('Invalid Login - missing parameters', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@tms.com' }
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
  });
});

describe('2. Authorization & Role Boundary Tests', () => {
  test('Access protected route without token should return 401', async () => {
    const res = await api('/api/admin/dashboard');
    assert.equal(res.status, 401);
    assert.equal(res.data.success, false);
  });

  test('Access protected route with invalid token should return 401', async () => {
    const res = await api('/api/admin/dashboard', {
      headers: { Authorization: 'Bearer fake.invalid.token' }
    });
    assert.equal(res.status, 401);
  });

  test('Student accessing Admin Dashboard should return 403 Forbidden', async () => {
    const res = await api('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(res.status, 403);
    assert.equal(res.data.success, false);
    assert.match(res.data.message, /Forbidden/);
  });

  test('Student accessing Trainer routes should return 403 Forbidden', async () => {
    const res = await api('/api/trainer/dashboard', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(res.status, 403);
  });

  test('Trainer accessing Admin routes should return 403 Forbidden', async () => {
    const res = await api('/api/admin/students', {
      headers: { Authorization: `Bearer ${trainerToken}` }
    });
    assert.equal(res.status, 403);
  });

  test('Trainer accessing Student routes should return 403 Forbidden', async () => {
    const res = await api('/api/student/dashboard', {
      headers: { Authorization: `Bearer ${trainerToken}` }
    });
    assert.equal(res.status, 403);
  });
});

describe('3. Student Module Tests', () => {
  test('Student Dashboard retrieves only own details', async () => {
    const res = await api('/api/student/dashboard', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.dashboard.student.name, 'Alice Johnson');
    assert.equal(res.data.dashboard.student.studentId, 'STU001');
    assert.ok(Array.isArray(res.data.dashboard.courses));
    assert.ok(res.data.dashboard.overallProgress >= 0);
  });

  test('Student marks a course module as completed', async () => {
    // Module 4 of CS101 is React (id: 4)
    const res = await api('/api/student/modules/4/complete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
  });

  test('Student cannot mark module for a course they are not enrolled in', async () => {
    // Alice is not enrolled in DS201 (e.g. module 5)
    const res = await api('/api/student/modules/5/complete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(res.status, 403);
  });

  test('Student view attendance history', async () => {
    const res = await api('/api/student/attendance', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.attendance));
  });

  test('Student view assessments list', async () => {
    const res = await api('/api/student/assessments', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.assessments));
  });
});

describe('4. Trainer Module Tests', () => {
  test('Trainer Dashboard shows workload and attention alerts', async () => {
    const res = await api('/api/trainer/dashboard', {
      headers: { Authorization: `Bearer ${trainerToken}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.dashboard.trainer, 'John Doe');
    assert.ok(res.data.dashboard.coursesCount > 0);
    assert.ok(Array.isArray(res.data.dashboard.studentsNeedingAttention));
  });

  test('Trainer marks attendance for assigned student', async () => {
    const res = await api('/api/trainer/attendance', {
      method: 'POST',
      headers: { Authorization: `Bearer ${trainerToken}` },
      body: {
        student_id: 1, // Alice
        course_id: 1,  // CS101
        date: '2026-09-28',
        status: 'PRESENT'
      }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
  });

  test('Trainer creates new assessment for course', async () => {
    const res = await api('/api/trainer/assessments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${trainerToken}` },
      body: {
        course_id: 1, // CS101
        title: 'Full-Stack Integration Exam',
        description: 'Testing end-to-end integration',
        max_marks: 100,
        due_date: '2026-11-01'
      }
    });
    assert.equal(res.status, 201);
    assert.ok(res.data.assessmentId);
  });

  test('Trainer enters marks for student', async () => {
    const res = await api('/api/trainer/assessments/2/marks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${trainerToken}` },
      body: {
        student_id: 1,
        marks_obtained: 90,
        remarks: 'Excellent API structure and clean middleware implementation.'
      }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
  });

  test('Trainer cannot view a student not enrolled in their courses', async () => {
    // Charlie (id: 3) is only in DS201 (instructed by Sarah, not John)
    const res = await api('/api/trainer/students/3', {
      headers: { Authorization: `Bearer ${trainerToken}` }
    });
    assert.equal(res.status, 403);
  });
});

describe('5. Admin Module Tests', () => {
  let createdStudentId;
  let createdTrainerId;
  let createdCourseId;
  const testId = Date.now();

  test('Admin Dashboard retrieves system metrics', async () => {
    const res = await api('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.dashboard.totalStudents >= 4);
    assert.ok(res.data.dashboard.totalTrainers >= 2);
    assert.ok(res.data.dashboard.totalCourses >= 3);
  });

  test('Admin creates a new Student', async () => {
    const res = await api('/api/admin/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Eva Green',
        email: `eva_${testId}@tms.com`,
        password: 'Student@123',
        student_code: `STU${testId.toString().slice(-4)}`,
        phone: '+1-555-0999'
      }
    });
    assert.equal(res.status, 201);
    assert.ok(res.data.studentId);
    createdStudentId = res.data.studentId;
  });

  test('Admin creates a new Trainer', async () => {
    const res = await api('/api/admin/trainers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Dr. Alan Turing',
        email: `alan_${testId}@tms.com`,
        password: 'Trainer@123',
        trainer_code: `TRN${testId.toString().slice(-4)}`,
        specialization: 'Theoretical Computer Science & Algorithms',
        phone: '+1-555-0777'
      }
    });
    assert.equal(res.status, 201);
    assert.ok(res.data.trainerId);
    createdTrainerId = res.data.trainerId;
  });

  test('Admin creates a new Course', async () => {
    const res = await api('/api/admin/courses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        code: `ALG${testId.toString().slice(-3)}`,
        title: 'Design and Analysis of Algorithms',
        description: 'Dynamic programming, greedy techniques, graph theory',
        modules: [
          { title: 'Divide and Conquer', description: 'Master theorem, sorting algorithms' },
          { title: 'Dynamic Programming', description: 'Memoization and optimal substructure' }
        ]
      }
    });
    assert.equal(res.status, 201);
    assert.ok(res.data.courseId);
    createdCourseId = res.data.courseId;
  });

  test('Admin assigns Trainer to Course', async () => {
    const res = await api('/api/admin/assign-trainer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { trainer_id: createdTrainerId, course_id: createdCourseId }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
  });

  test('Admin enrolls Student into Course', async () => {
    const res = await api('/api/admin/enroll-student', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { student_id: createdStudentId, course_id: createdCourseId }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
  });

  test('Admin views system reports', async () => {
    const res = await api('/api/admin/reports', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.reports.courses.length >= 4);
    assert.ok(res.data.reports.performance);
    assert.ok(res.data.reports.attendance);
  });

  test('Admin posts system announcement', async () => {
    const res = await api('/api/admin/announcements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'System Maintenance Notice',
        content: 'Brief downtime scheduled on Sunday 2:00 AM.',
        target_role: 'ALL'
      }
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
  });

  test('Admin deletes student and ensures clean cascading', async () => {
    const res = await api(`/api/admin/students/${createdStudentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
  });
});
