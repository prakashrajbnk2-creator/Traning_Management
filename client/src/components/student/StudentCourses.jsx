import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { BookOpen, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

export function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentCourses();
      if (res.success) {
        setCourses(res.courses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteModule = async (moduleId, moduleTitle) => {
    try {
      setUpdatingId(moduleId);
      const res = await api.markModuleComplete(moduleId);
      if (res.success) {
        setSuccessMsg(`Marked "${moduleTitle}" as completed! Your progress has updated.`);
        fetchCourses();
      }
    } catch (err) {
      alert(err.message || 'Failed to update progress.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <HelperBanner
        title="Interactive Curriculum & Learning Modules"
        description="Follow your structured course syllabus topic by topic. As you master each module, mark it complete to increase your course progress percentage."
        tip="Completing all modules brings your course completion status to 100%."
        nextAction="Click 'Mark Complete' on any module you have finished studying."
      />

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          ✔ {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading syllabus modules...</div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>You are not currently enrolled in any courses.</div>
        ) : (
          courses.map((course) => {
            const completedCount = course.modules?.filter(m => m.completed === 1).length || 0;
            const totalCount = course.modules?.length || 1;
            const pct = Math.round((completedCount / totalCount) * 100);

            return (
              <div key={course.id} className="card" style={{ margin: 0 }}>
                {/* Course Header */}
                <div className="card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-primary">{course.code}</span>
                      <span className="badge badge-success">{course.enrollment_status}</span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{course.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>{course.description}</p>
                    <div style={{ fontSize: '0.8rem', color: '#4338ca', marginTop: '6px' }}>
                      Faculty: <strong>{course.trainers?.map(t => t.name).join(', ') || 'Department Faculty'}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '140px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4f46e5' }}>{pct}%</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{completedCount} of {totalCount} completed</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar-bg" style={{ marginBottom: '20px' }}>
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: '#4f46e5' }} />
                </div>

                {/* Modules list */}
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: '#1e293b' }}>
                  Syllabus Learning Modules
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {course.modules?.map((m) => {
                    const isDone = m.completed === 1;
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          border: isDone ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                          borderRadius: '10px',
                          background: isDone ? '#f5f3ff' : '#ffffff',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {isDone ? (
                            <CheckCircle2 size={20} style={{ color: '#4f46e5', flexShrink: 0 }} />
                          ) : (
                            <Circle size={20} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isDone ? '#312e81' : '#0f172a' }}>
                              Module #{m.order_index}: {m.title}
                            </div>
                            {m.description && (
                              <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '2px' }}>
                                {m.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          {isDone ? (
                            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                              ✔ Completed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCompleteModule(m.id, m.title)}
                              className="btn btn-outline btn-sm"
                              disabled={updatingId === m.id}
                            >
                              {updatingId === m.id ? 'Updating...' : 'Mark as Completed'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default StudentCourses;
