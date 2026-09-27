import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { MetricCard } from '../common/MetricCard.jsx';
import { DonutChart } from '../common/Charts.jsx';
import { BookOpen, CalendarCheck, Award, TrendingUp, Calendar, Megaphone, CheckCircle2, ArrowRight } from 'lucide-react';

export function StudentDashboard({ setTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentDashboard();
      if (res.success) {
        setData(res.dashboard);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch student dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading your personal learning dashboard...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', background: '#fef2f2', color: '#dc2626', borderRadius: '10px' }}>{error}</div>;
  }

  const s = data?.student;

  return (
    <div>
      {/* Student Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            STUDENT ACADEMIC PORTAL • ID: {s?.studentId}
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em' }}>
            Welcome, {s?.name} 👋
          </h2>
          <p style={{ color: '#e0e7ff', fontSize: '0.925rem', marginTop: '6px', maxWidth: '520px' }}>
            Track your course progress, attend lectures, submit assessments, and review instructor evaluations all in one place.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setTab('courses')} className="btn" style={{ background: '#ffffff', color: '#312e81', fontWeight: 700 }}>
            <BookOpen size={16} /> My Courses
          </button>
          <button onClick={() => setTab('assessments')} className="btn" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}>
            <Award size={16} /> Exams & Marks
          </button>
        </div>
      </div>

      <HelperBanner
        title="Student Learning Hub"
        description="This dashboard displays your personalized academic status. You can only view your own records."
        tip="Completing course modules increases your 'Overall Progress' percentage."
        nextAction="Check 'Upcoming Assessments' below to prepare for upcoming tests."
      />

      {/* KPI Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Overall Progress"
          value={`${data?.overallProgress || 0}%`}
          subtext="Syllabus modules completed"
          icon={TrendingUp}
          color="#4f46e5"
          bgLight="#eef2ff"
        />
        <MetricCard
          title="Attendance"
          value={`${data?.overallAttendance || 0}%`}
          subtext="Session compliance rate"
          icon={CalendarCheck}
          color="#10b981"
          bgLight="#ecfdf5"
        />
        <MetricCard
          title="Average Marks"
          value={`${data?.averageMarks || 0}%`}
          subtext="Across completed exams"
          icon={Award}
          color="#0ea5e9"
          bgLight="#f0f9ff"
        />
      </div>

      {/* My Courses Section */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h3>My Enrolled Courses ({data?.courses?.length || 0})</h3>
            <p>Your current active curricula and syllabus progress</p>
          </div>
          <button onClick={() => setTab('courses')} className="btn btn-outline btn-sm">
            <span>Open Syllabus</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {(data?.courses || []).map((c) => (
            <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', background: '#fafbfd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="badge badge-primary">{c.code}</span>
                <span className="badge badge-success">{c.status}</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{c.title}</h4>

              {/* Trainers assigned */}
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
                Faculty: <strong>{c.trainers?.map(t => t.name).join(', ') || 'Assigned Instructor'}</strong>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Curriculum Progress:</span>
                  <strong style={{ color: '#4f46e5' }}>{c.progressPercentage}% ({c.completedModules}/{c.totalModules} modules)</strong>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${c.progressPercentage}%`, background: '#4f46e5' }} />
                </div>
              </div>

              {/* Attendance in course */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <span>Attendance Record:</span>
                <strong style={{ color: c.attendancePercentage >= 75 ? '#059669' : '#dc2626' }}>
                  {c.attendancePercentage}%
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assessments & Announcements Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Upcoming Assessments */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <h3>Upcoming Assessments ({data?.upcomingAssessments?.length || 0})</h3>
              <p>Upcoming milestones and evaluation deadlines</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(data?.upcomingAssessments || []).length > 0 ? (
              data.upcomingAssessments.map((a) => (
                <div key={a.assessmentId} style={{ padding: '12px 14px', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#fafbfd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{a.title}</strong>
                    <span className="badge badge-primary">{a.courseCode}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    {a.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#0ea5e9', fontWeight: 600 }}>
                    <span>Max Score: {a.maxMarks} points</span>
                    <span>Due Date: {a.dueDate || 'Ongoing'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '10px 0' }}>
                No pending upcoming assessments. You are all caught up!
              </div>
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <h3>Completed Assessment Scores</h3>
              <p>Graded examinations and faculty feedback</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(data?.completedAssessments || []).length > 0 ? (
              data.completedAssessments.map((r) => (
                <div key={r.assessmentId} style={{ padding: '12px 14px', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#fafbfd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{r.title}</strong>
                    <span className={`badge ${r.percentage >= 75 ? 'badge-success' : 'badge-warning'}`}>
                      {r.marksObtained}/{r.maxMarks} ({r.percentage}%)
                    </span>
                  </div>
                  {r.remarks && (
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '6px', fontStyle: 'italic', background: '#fff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      💬 "{r.remarks}"
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '10px 0' }}>
                No assessments graded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Announcements Board */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={18} style={{ color: '#4f46e5' }} /> Announcements for You
            </h3>
            <p>Official notices from institution administrators and faculty</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(data?.announcements || []).map((ann) => (
            <div key={ann.id} style={{ padding: '14px', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#fafbfd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: '#0f172a' }}>{ann.title}</strong>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ann.created_at?.slice(0, 10)}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>{ann.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
