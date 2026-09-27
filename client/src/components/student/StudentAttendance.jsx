import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { CalendarCheck, CheckCircle2, Clock, XCircle } from 'lucide-react';

export function StudentAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentAttendance();
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

  const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
  const lateCount = attendance.filter(a => a.status === 'LATE').length;
  const absentCount = attendance.filter(a => a.status === 'ABSENT').length;
  const total = attendance.length;
  const pct = total > 0 ? Math.round(((presentCount + lateCount * 0.5) / total) * 100) : 100;

  return (
    <div>
      <HelperBanner
        title="Personal Attendance History"
        description="Verify your attendance compliance across all lecture cohorts and laboratory sessions."
        tip="Students are required to maintain at least 75% attendance to qualify for course certification."
        nextAction="Check session records below to ensure all your presences were recorded correctly."
      />

      {/* Attendance Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ margin: 0, padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Overall Compliance</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: pct >= 75 ? '#10b981' : '#dc2626', marginTop: '4px' }}>
            {pct}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            {pct >= 75 ? 'Meets requirement' : 'Action needed'}
          </div>
        </div>

        <div className="card" style={{ margin: 0, padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Present Sessions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {presentCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Full credits</div>
        </div>

        <div className="card" style={{ margin: 0, padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Late Arrivals</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            {lateCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Half credits</div>
        </div>

        <div className="card" style={{ margin: 0, padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Absences</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
            {absentCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Excused / Unexcused</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h3>Logged Session History ({attendance.length})</h3>
            <p>Certified records marked by your course instructors</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Status</th>
                <th>Marked By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading records...</td></tr>
              ) : attendance.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No attendance sessions logged yet.</td></tr>
              ) : (
                attendance.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.date}</strong></td>
                    <td><span className="badge badge-primary">{a.course_code}</span> {a.course_title}</td>
                    <td>{getStatusBadge(a.status)}</td>
                    <td style={{ color: '#64748b' }}>{a.marked_by || 'Course Faculty'}</td>
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

export default StudentAttendance;
