import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { MetricCard } from '../common/MetricCard.jsx';
import { Users, BookOpen, CalendarCheck, Award, AlertTriangle, Plus, CheckCircle2 } from 'lucide-react';

export function TrainerDashboard({ setTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getTrainerDashboard();
      if (res.success) {
        setData(res.dashboard);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch trainer dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading faculty workspace...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', background: '#fef2f2', color: '#dc2626', borderRadius: '10px' }}>{error}</div>;
  }

  return (
    <div>
      <HelperBanner
        title={`Faculty Workspace: Welcome, ${data?.trainer} 👋`}
        description={`You are currently instructing ${data?.coursesCount || 0} active curriculum cohorts covering ${data?.assignedStudents || 0} enrolled students.`}
        tip="Review the 'Students Requiring Attention' alert panel below to identify learners with low attendance or lagging exam marks."
        nextAction="Click 'Mark Attendance' or 'Enter Marks' to record session evaluations."
      />

      {/* Quick Action Shortcuts */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button onClick={() => setTab('attendance')} className="btn btn-primary btn-sm">
          <CalendarCheck size={16} /> Mark Attendance
        </button>
        <button onClick={() => setTab('assessments')} className="btn btn-outline btn-sm">
          <Plus size={16} /> + Create Assessment
        </button>
        <button onClick={() => setTab('marks')} className="btn btn-outline btn-sm">
          <Award size={16} /> Enter / Update Marks
        </button>
        <button onClick={() => setTab('students')} className="btn btn-outline btn-sm">
          <Users size={16} /> View My Students
        </button>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Assigned Students"
          value={data?.assignedStudents || 0}
          subtext="Across your cohorts"
          icon={Users}
          color="#0ea5e9"
          bgLight="#f0f9ff"
        />
        <MetricCard
          title="Assigned Courses"
          value={data?.coursesCount || 0}
          subtext="Authorized curricula"
          icon={BookOpen}
          color="#4f46e5"
          bgLight="#eef2ff"
        />
        <MetricCard
          title="Avg Attendance"
          value={`${data?.averageAttendance || 0}%`}
          subtext="In your course sessions"
          icon={CalendarCheck}
          color="#10b981"
          bgLight="#ecfdf5"
        />
        <MetricCard
          title="Avg Student Marks"
          value={`${data?.averageStudentMarks || 0}%`}
          subtext="Across completed exams"
          icon={Award}
          color="#f59e0b"
          bgLight="#fffbeb"
        />
      </div>

      {/* Students Requiring Attention */}
      <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
        <div className="card-header">
          <div className="card-title">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309' }}>
              <AlertTriangle size={18} />
              Students Requiring Academic Attention ({data?.studentsNeedingAttention?.length || 0})
            </h3>
            <p>Students flagged with attendance below 75% or assessment scores below 60%</p>
          </div>
        </div>

        {data?.studentsNeedingAttention?.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {data.studentsNeedingAttention.map((s) => (
              <div key={s.studentId} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong>{s.name}</strong>
                  <span className="badge badge-warning">{s.studentCode}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '6px', fontWeight: 600 }}>
                  ⚠️ {s.reasons}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.75rem', color: '#78350f' }}>
                  <span>Attendance: <strong>{s.attendancePct}%</strong></span>
                  {s.marksPct !== null && <span>Avg Marks: <strong>{s.marksPct}%</strong></span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '0.9rem', padding: '10px 0' }}>
            <CheckCircle2 size={18} />
            <span>All students in your courses are currently meeting expected performance benchmarks!</span>
          </div>
        )}
      </div>

      {/* Recent Assessments & Assigned Courses Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Recent Assessments */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <h3>Recent Assessments</h3>
              <p>Exams and assignments created for your courses</p>
            </div>
            <button onClick={() => setTab('assessments')} className="btn btn-outline btn-sm">View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(data?.recentAssessments || []).length > 0 ? (
              data.recentAssessments.map((a) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#fafbfd' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Course: <strong>{a.course_code}</strong> | Due: {a.due_date || 'Ongoing'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-neutral">{a.submissions_count} graded</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No assessments created yet.</div>
            )}
          </div>
        </div>

        {/* Assigned Courses */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <h3>Your Authorized Courses</h3>
              <p>Subjects allocated for your instruction</p>
            </div>
            <button onClick={() => setTab('courses')} className="btn btn-outline btn-sm">Curriculum Details</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(data?.courses || []).map((c) => (
              <div key={c.id} style={{ padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#fafbfd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="badge badge-primary">{c.code}</span>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Active Cohort</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{c.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>{c.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrainerDashboard;
