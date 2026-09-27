import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { Award, Calendar, CheckCircle2, Clock } from 'lucide-react';

export function StudentAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentAssessments();
      if (res.success) {
        setAssessments(res.assessments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const graded = assessments.filter(a => a.marks_obtained !== null);
  const pending = assessments.filter(a => a.marks_obtained === null);

  const avgMarks = graded.length > 0
    ? Math.round(graded.reduce((acc, curr) => acc + (curr.marks_obtained / curr.max_marks) * 100, 0) / graded.length)
    : 0;

  return (
    <div>
      <HelperBanner
        title="Examinations, Tests & Project Scores"
        description="Review all scheduled quizzes, milestone projects, and evaluations across your enrolled curriculums."
        tip="Instructors provide qualitative comments alongside scores to guide your learning."
        nextAction="Check upcoming tests below to plan your preparation."
      />

      {/* Score Summary Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ margin: 0, padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Academic Performance</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>
            {avgMarks}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Average score across graded tests</div>
        </div>

        <div className="card" style={{ margin: 0, padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Completed Tests</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {graded.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Successfully evaluated</div>
        </div>

        <div className="card" style={{ margin: 0, padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Upcoming Examinations</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0ea5e9', marginTop: '4px' }}>
            {pending.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Pending evaluations</div>
        </div>
      </div>

      {/* Upcoming Assessments */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">
            <h3>Upcoming Assessments ({pending.length})</h3>
            <p>Milestones scheduled for your cohorts</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pending.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No upcoming tests scheduled at this time.</div>
          ) : (
            pending.map((a) => (
              <div key={a.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fafbfd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="badge badge-primary" style={{ marginBottom: '6px' }}>{a.course_code}</span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{a.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>{a.description}</p>
                  </div>
                  <span className="badge badge-warning"><Clock size={12} /> Upcoming</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#475569' }}>
                  <span>Maximum Points: <strong>{a.max_marks} pts</strong></span>
                  <span style={{ color: '#0ea5e9', fontWeight: 600 }}>Due Date: {a.due_date || 'Ongoing'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Graded Results */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h3>Graded Examinations & Feedback ({graded.length})</h3>
            <p>Scores and qualitative evaluator remarks</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Assessment</th>
                <th>Score Obtained</th>
                <th>Percentage</th>
                <th>Evaluator Remarks</th>
              </tr>
            </thead>
            <tbody>
              {graded.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No graded tests recorded yet.</td></tr>
              ) : (
                graded.map((g) => {
                  const pct = Math.round((g.marks_obtained / g.max_marks) * 100);
                  return (
                    <tr key={g.id}>
                      <td><span className="badge badge-primary">{g.course_code}</span></td>
                      <td><strong>{g.title}</strong></td>
                      <td>
                        <strong style={{ fontSize: '1rem', color: pct >= 75 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626' }}>
                          {g.marks_obtained} / {g.max_marks}
                        </strong>
                      </td>
                      <td>
                        <span className={`badge ${pct >= 75 ? 'badge-success' : 'badge-warning'}`}>
                          {pct}%
                        </span>
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.85rem' }}>
                        {g.remarks || 'No written remarks logged.'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentAssessments;
