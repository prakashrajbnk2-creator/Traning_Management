import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { Search, Filter, CalendarCheck, CheckCircle2, Clock, XCircle } from 'lucide-react';

export function AttendanceView() {
  const [attendance, setAttendance] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [courseFilter, setCourseFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchAttendance();
  }, [courseFilter, dateFilter]);

  const fetchCourses = async () => {
    try {
      const res = await api.getAllCourses();
      if (res.success) setCourses(res.courses);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (courseFilter) params.append('course_id', courseFilter);
      if (dateFilter) params.append('date', dateFilter);
      const res = await api.getAllAttendance(params.toString());
      if (res.success) {
        setAttendance(res.attendance);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> PRESENT</span>;
      case 'LATE':
        return <span className="badge badge-warning"><Clock size={12} /> LATE</span>;
      case 'ABSENT':
        return <span className="badge badge-danger"><XCircle size={12} /> ABSENT</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div>
      <HelperBanner
        title="Institution-Wide Attendance Log"
        description="Review student presence records across all lecture cohorts and laboratory sessions."
        tip="Filter by course or specific date to audit faculty attendance reporting."
        nextAction="Select a specific curriculum below to filter the attendance history."
      />

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="card-title">
            <h3>Session Attendance Records ({attendance.length})</h3>
            <p>Verified daily attendance logs</p>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '180px' }}
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.title}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="form-control"
              style={{ width: 'auto' }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />

            {(courseFilter || dateFilter) && (
              <button
                onClick={() => { setCourseFilter(''); setDateFilter(''); }}
                className="btn btn-outline btn-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Student</th>
                <th>Student Code</th>
                <th>Attendance Status</th>
                <th>Verified By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading attendance records...</td></tr>
              ) : attendance.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No attendance records found matching filters.</td></tr>
              ) : (
                attendance.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.date}</strong></td>
                    <td><span className="badge badge-primary">{a.course_code}</span> {a.course_title}</td>
                    <td>{a.student_name}</td>
                    <td><span className="badge badge-neutral">{a.student_code}</span></td>
                    <td>{getStatusBadge(a.status)}</td>
                    <td style={{ color: '#64748b' }}>{a.marked_by_trainer || 'Faculty'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AttendanceView;
