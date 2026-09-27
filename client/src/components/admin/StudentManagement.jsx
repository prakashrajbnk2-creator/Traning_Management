import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { Modal } from '../common/Modal.jsx';
import { Plus, Search, Eye, Edit2, Trash2, GraduationCap, CheckCircle2, XCircle } from 'lucide-react';

export function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewStudentDetails, setViewStudentDetails] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    student_code: '',
    phone: '',
    status: 'ACTIVE'
  });
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, [search, statusFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.getAllStudents(params.toString());
      if (res.success) {
        setStudents(res.students);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.getAllCourses();
      if (res.success) {
        setCourses(res.courses);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: 'Student@123',
      student_code: `STU${Math.floor(100 + Math.random() * 900)}`,
      phone: '',
      status: 'ACTIVE'
    });
    setModalError('');
    setIsAddOpen(true);
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      setModalError('');
      const res = await api.createStudent(formData);
      if (res.success) {
        setIsAddOpen(false);
        setSuccessMsg(`Student "${formData.name}" registered successfully.`);
        fetchStudents();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to create student.');
    }
  };

  const handleOpenEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      status: student.status
    });
    setModalError('');
    setIsEditOpen(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      setModalError('');
      const res = await api.updateStudent(selectedStudent.id, formData);
      if (res.success) {
        setIsEditOpen(false);
        setSuccessMsg('Student information updated.');
        fetchStudents();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to update student.');
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${studentName}"? This will delete all their enrollments and progress.`)) {
      return;
    }

    try {
      const res = await api.deleteStudent(studentId);
      if (res.success) {
        setSuccessMsg(`Student deleted.`);
        fetchStudents();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete student.');
    }
  };

  const handleOpenEnroll = (student) => {
    setSelectedStudent(student);
    setEnrollCourseId(courses[0]?.id || '');
    setModalError('');
    setIsEnrollOpen(true);
  };

  const handleEnrollCourse = async (e) => {
    e.preventDefault();
    try {
      setModalError('');
      const res = await api.enrollStudent({ student_id: selectedStudent.id, course_id: parseInt(enrollCourseId, 10) });
      if (res.success) {
        setIsEnrollOpen(false);
        setSuccessMsg(`Enrolled student in course.`);
        fetchStudents();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to enroll student.');
    }
  };

  const handleOpenView = (student) => {
    setSelectedStudent(student);
    setIsViewOpen(true);
  };

  return (
    <div>
      <HelperBanner
        title="Student Registry & Enrollment Center"
        description="Search, register, update profiles, or assign students to certified training curriculums."
        tip="Click '+ Add Student' to register a new learner. Click 'Enroll' in any row to assign them to another course."
        nextAction="Use the search bar to locate students by name, email, or student code."
      />

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          ✔ {successMsg}
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="Search by student name, code, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '130px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} /> + Add Student
          </button>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Enrolled Courses</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading student records...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No students found matching your criteria.</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                        {s.student_code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      {s.phone && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.phone}</div>}
                    </td>
                    <td>{s.email}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {s.enrolledCourses?.length > 0 ? (
                          s.enrolledCourses.map((c) => (
                            <span key={c.id} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                              {c.code}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>None</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {s.status === 'ACTIVE' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEnroll(s)}
                          className="btn btn-outline btn-sm"
                          title="Enroll into Course"
                        >
                          <GraduationCap size={14} /> Enroll
                        </button>
                        <button
                          onClick={() => handleOpenView(s)}
                          className="btn btn-outline btn-sm"
                          title="View Profile Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="btn btn-outline btn-sm"
                          title="Edit Profile"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#ef4444' }}
                          title="Delete Student"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Student"
        footer={(
          <>
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" form="add-student-form" className="btn btn-primary">+ Register Student</button>
          </>
        )}
      >
        {modalError && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>{modalError}</div>}
        <form id="add-student-form" onSubmit={handleCreateStudent}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Jordan Hayes"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              className="form-control"
              placeholder="jordan@tms.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Student Identification Code *</label>
            <input
              type="text"
              className="form-control"
              placeholder="STU005"
              value={formData.student_code}
              onChange={(e) => setFormData({ ...formData, student_code: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="+1-555-0123"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Initial Temporary Password *</label>
            <input
              type="password"
              className="form-control"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Student: ${selectedStudent?.name}`}
        footer={(
          <>
            <button type="button" onClick={() => setIsEditOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" form="edit-student-form" className="btn btn-primary">Save Changes</button>
          </>
        )}
      >
        {modalError && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>{modalError}</div>}
        <form id="edit-student-form" onSubmit={handleUpdateStudent}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              className="form-control"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Account Status</label>
            <select
              className="form-control"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE (Can log in)</option>
              <option value="INACTIVE">INACTIVE (Access blocked)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Enroll in Course Modal */}
      <Modal
        isOpen={isEnrollOpen}
        onClose={() => setIsEnrollOpen(false)}
        title={`Enroll ${selectedStudent?.name} into Course`}
        footer={(
          <>
            <button type="button" onClick={() => setIsEnrollOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" form="enroll-student-form" className="btn btn-primary">Confirm Enrollment</button>
          </>
        )}
      >
        {modalError && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>{modalError}</div>}
        <form id="enroll-student-form" onSubmit={handleEnrollCourse}>
          <div className="form-group">
            <label>Select Course to Enroll</label>
            <select
              className="form-control"
              value={enrollCourseId}
              onChange={(e) => setEnrollCourseId(e.target.value)}
              required
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.title}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* View Student Details Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Student Profile: ${selectedStudent?.name}`}
        maxWidth="640px"
        footer={(
          <button type="button" onClick={() => setIsViewOpen(false)} className="btn btn-primary">Close</button>
        )}
      >
        {selectedStudent && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Student Code</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedStudent.student_code}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Email</span>
                <div style={{ fontWeight: 600 }}>{selectedStudent.email}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Phone</span>
                <div>{selectedStudent.phone || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Account Status</span>
                <div><span className={`badge ${selectedStudent.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>{selectedStudent.status}</span></div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>Enrolled Courses</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedStudent.enrolledCourses?.length > 0 ? (
                selectedStudent.enrolledCourses.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div>
                      <strong>[{c.code}]</strong> {c.title}
                    </div>
                    <span className="badge badge-primary">ACTIVE ENROLLMENT</span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No current course enrollments.</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default StudentManagement;
