import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { Modal } from '../common/Modal.jsx';
import { CalendarCheck, Plus, CheckCircle2, Clock, XCircle, Edit2 } from 'lucide-react';

export function TrainerAttendance() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mark attendance form
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('PRESENT');

  // Edit attendance modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('PRESENT');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [cRes, sRes] = await Promise.all([
        api.getTrainerCourses(),
        api.getTrainerStudents()
      ]);

      if (cRes.success) {
        setCourses(cRes.courses);
        if (cRes.courses[0]) setSelectedCourseId(cRes.courses[0].id);
      }
      if (sRes.success) {
        setStudents(sRes.students);
        if (sRes.students[0]) setSelectedStudentId(sRes.students[0].id);
      }
      fetchAttendance();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.getTrainerAttendance();
      if (res.success) {
        setAttendance(res.attendance);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await api.markAttendance({
        student_id: parseInt(selectedStudentId, 10),
        course_id: parseInt(selectedCourseId, 10),
        date: attendanceDate,
        status
      });

      if (res.success) {
        setMessage(`Attendance marked as ${status} for ${attendanceDate}.`);
        fetchAttendance();
      }
    } catch (err) {
      setError(err.message || 'Failed to record attendance.');
    }
  };

  const handleOpenEdit = (rec) => {
    setEditRecord(rec);
    setEditStatus(rec.status);
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateAttendance(editRecord.id, { status: editStatus });
      if (res.success) {
        setIsEditOpen(false);
        setMessage('Attendance status updated.');
        fetchAttendance();
      }
    } catch (err) {
      alert(err.message || 'Update failed.');
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'PRESENT':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> PRESENT</span>;
      case 'LATE':
        return <span className="badge badge-warning"><Clock size={12} /> LATE</span>;
      case 'ABSENT':
        return <span className="badge badge-danger"><XCircle size={12} /> ABSENT</span>;
      default:
        return <span className="badge badge-neutral">{st}</span>;
    }
  };

  return (
    <div>
      <HelperBanner
        title="Session Attendance Management"
        description="Record and update student presence for your course cohorts on lecture or lab dates."
        tip="Marking attendance helps calculate course completion rates and flags at-risk students automatically."
        nextAction="Select the student, course, and date below, then click 'Submit Attendance Record'."
      />

      {message && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          ✔ {message}
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          ✖ {error}
        </div>
      )}

      {/* Mark Attendance Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <div className="card-title">
            <h3>Mark Student Attendance</h3>
            <p>Select student, curriculum cohort, and session presence</p>
          </div>
          <span className="badge badge-primary"><CalendarCheck size={14} /> Quick Entry</span>
        </div>

        <form onSubmit={handleMarkAttendance}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Student</label>
              <select
                className="form-control"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.student_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Course</label>
              <select
                className="form-control"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                required
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Session Date</label>
              <input
                type="date"
                className="form-control"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Attendance Status</label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="PRESENT">PRESENT (Full Credit)</option>
                <option value="LATE">LATE (Partial Credit)</option>
                <option value="ABSENT">ABSENT (No Credit)</option>
              </select>
            </div>

            <div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <CheckCircle2 size={16} /> Submit Attendance
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Attendance History Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h3>Recent Attendance Records ({attendance.length})</h3>
            <p>History of attendance logged for your courses</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Student</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading attendance records...</td></tr>
              ) : attendance.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No attendance logged yet. Use the form above to record session presence.</td></tr>
              ) : (
                attendance.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.date}</strong></td>
                    <td><span className="badge badge-primary">{a.course_code}</span> {a.course_title}</td>
                    <td>{a.student_name} ({a.student_code})</td>
                    <td>{getStatusBadge(a.status)}</td>
                    <td>
                      <button onClick={() => handleOpenEdit(a)} className="btn btn-outline btn-sm">
                        <Edit2 size={13} /> Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Attendance Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Modify Attendance Record"
        footer={(
          <>
            <button type="button" onClick={() => setIsEditOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" form="edit-att-form" className="btn btn-primary">Save Changes</button>
          </>
        )}
      >
        <form id="edit-att-form" onSubmit={handleUpdate}>
          <div style={{ marginBottom: '14px', fontSize: '0.9rem' }}>
            Updating attendance for <strong>{editRecord?.student_name}</strong> on <strong>{editRecord?.date}</strong>.
          </div>
          <div className="form-group">
            <label>Updated Status</label>
            <select
              className="form-control"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="ABSENT">ABSENT</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TrainerAttendance;
