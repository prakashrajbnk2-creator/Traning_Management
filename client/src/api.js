// API Service with JWT authentication and error handling

const API_BASE = '/api';

export function getToken() {
  return localStorage.getItem('tms_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('tms_token', token);
  } else {
    localStorage.removeItem('tms_token');
  }
}

export function getUser() {
  const user = localStorage.getItem('tms_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

export function setUser(user) {
  if (user) {
    localStorage.setItem('tms_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('tms_user');
  }
}

export async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => null);

    if (res.status === 401 && !endpoint.includes('/auth/login')) {
      // Token expired or invalid
      setToken(null);
      setUser(null);
      window.dispatchEvent(new Event('auth_expired'));
    }

    if (!res.ok) {
      const errorMsg = data?.message || `Request failed with status ${res.status}`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  getMe: () => request('/auth/me'),

  // Student
  getStudentDashboard: () => request('/student/dashboard'),
  getStudentCourses: () => request('/student/courses'),
  markModuleComplete: (moduleId) => request(`/student/modules/${moduleId}/complete`, { method: 'POST' }),
  getStudentAttendance: () => request('/student/attendance'),
  getStudentAssessments: () => request('/student/assessments'),

  // Trainer
  getTrainerDashboard: () => request('/trainer/dashboard'),
  getTrainerCourses: () => request('/trainer/courses'),
  getTrainerStudents: () => request('/trainer/students'),
  getStudentProfileForTrainer: (studentId) => request(`/trainer/students/${studentId}`),
  getTrainerAttendance: (params = '') => request(`/trainer/attendance${params ? '?' + params : ''}`),
  markAttendance: (payload) => request('/trainer/attendance', { method: 'POST', body: payload }),
  updateAttendance: (id, payload) => request(`/trainer/attendance/${id}`, { method: 'PUT', body: payload }),
  getTrainerAssessments: () => request('/trainer/assessments'),
  createAssessment: (payload) => request('/trainer/assessments', { method: 'POST', body: payload }),
  getAssessmentResults: (id) => request(`/trainer/assessments/${id}/results`),
  enterMarks: (assessmentId, payload) => request(`/trainer/assessments/${assessmentId}/marks`, { method: 'POST', body: payload }),
  getTrainerProgress: () => request('/trainer/progress'),

  // Admin
  getAdminDashboard: () => request('/admin/dashboard'),
  getAdminReports: () => request('/admin/reports'),
  getAllStudents: (params = '') => request(`/admin/students${params ? '?' + params : ''}`),
  createStudent: (payload) => request('/admin/students', { method: 'POST', body: payload }),
  updateStudent: (id, payload) => request(`/admin/students/${id}`, { method: 'PUT', body: payload }),
  deleteStudent: (id) => request(`/admin/students/${id}`, { method: 'DELETE' }),
  getAllTrainers: () => request('/admin/trainers'),
  createTrainer: (payload) => request('/admin/trainers', { method: 'POST', body: payload }),
  updateTrainer: (id, payload) => request(`/admin/trainers/${id}`, { method: 'PUT', body: payload }),
  deleteTrainer: (id) => request(`/admin/trainers/${id}`, { method: 'DELETE' }),
  getAllCourses: () => request('/admin/courses'),
  createCourse: (payload) => request('/admin/courses', { method: 'POST', body: payload }),
  updateCourse: (id, payload) => request(`/admin/courses/${id}`, { method: 'PUT', body: payload }),
  deleteCourse: (id) => request(`/admin/courses/${id}`, { method: 'DELETE' }),
  assignTrainer: (payload) => request('/admin/assign-trainer', { method: 'POST', body: payload }),
  unassignTrainer: (payload) => request('/admin/unassign-trainer', { method: 'DELETE', body: payload }),
  enrollStudent: (payload) => request('/admin/enroll-student', { method: 'POST', body: payload }),
  unenrollStudent: (payload) => request('/admin/unenroll-student', { method: 'DELETE', body: payload }),
  getAllAttendance: (params = '') => request(`/admin/attendance${params ? '?' + params : ''}`),
  getAllAssessments: (params = '') => request(`/admin/assessments${params ? '?' + params : ''}`),
  getAllAnnouncements: () => request('/admin/announcements'),
  createAnnouncement: (payload) => request('/admin/announcements', { method: 'POST', body: payload })
};

export default api;
