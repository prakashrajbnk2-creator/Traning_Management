import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { Modal } from '../common/Modal.jsx';
import { Eye, Users, CalendarCheck, Award, BookOpen } from 'lucide-react';

export function TrainerStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailedProfile, setDetailedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getTrainerStudents();
      if (res.success) {
        setStudents(res.students);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfile = async (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setProfileLoading(true);
    try {
      const res = await api.getStudentProfileForTrainer(student.id);
      if (res.success) {
        setDetailedProfile(res.student);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div>
      <HelperBanner
        title="Student Roster in Your Cohorts"
        description="Inspect learning progress, attendance compliance, and assessment scores for students enrolled in your courses."
        tip="Instructors can view individual student dossiers detailing module completions and recent quiz marks."
        nextAction="Click 'View Dossier' next to any student to open their comprehensive learning profile."
      />

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h3>Enrolled Cohort Students ({students.length})</h3>
            <p>Students currently assigned to your course sections</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student Code</th>
                <th>Name</th>
                <th>Email</th>
                <th>Enrolled Courses</th>
                <th>Attendance</th>
                <th>Avg Marks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading student roster...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No students currently assigned to your courses.</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id}>
                    <td><span className="badge badge-neutral" style={{ fontWeight: 700 }}>{s.student_code}</span></td>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.email}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {s.enrolledCourses?.map((c) => (
                          <span key={c.id} className="badge badge-primary">{c.code}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: s.attendancePercentage >= 75 ? '#059669' : '#dc2626' }}>
                        {s.attendancePercentage}%
                      </strong>
                    </td>
                    <td>
                      {s.averageMarks !== null ? (
                        <strong style={{ color: s.averageMarks >= 60 ? '#0ea5e9' : '#dc2626' }}>
                          {s.averageMarks}%
                        </strong>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => handleOpenProfile(s)} className="btn btn-outline btn-sm">
                        <Eye size={14} /> View Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Dossier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Student Learning Dossier: ${selectedStudent?.name}`}
        maxWidth="680px"
        footer={<button onClick={() => setIsModalOpen(false)} className="btn btn-primary">Close</button>}
      >
        {profileLoading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading student records...</div>
        ) : detailedProfile ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Student Code</span>
                <div style={{ fontWeight: 700 }}>{detailedProfile.student_code}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Email</span>
                <div style={{ fontSize: '0.85rem' }}>{detailedProfile.email}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Phone</span>
                <div style={{ fontSize: '0.85rem' }}>{detailedProfile.phone || 'N/A'}</div>
              </div>
            </div>

            {/* Syllabus Progress */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>Course Syllabus Progress</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {detailedProfile.progress?.map((p) => (
                <div key={p.courseId} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong>[{p.courseCode}] {p.courseTitle}</strong>
                    <strong style={{ color: '#4f46e5' }}>{p.percentage}% ({p.completedModules}/{p.totalModules} modules)</strong>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${p.percentage}%`, background: '#4f46e5' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Assessment Scores */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>Exam Scores & Marks</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {detailedProfile.marks?.length > 0 ? (
                detailedProfile.marks.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fafbfd', border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div>
                      <strong>[{m.course_code}] {m.title}</strong>
                      {m.remarks && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Feedback: {m.remarks}</div>}
                    </div>
                    <div>
                      <strong>{m.marks_obtained} / {m.max_marks}</strong> ({Math.round((m.marks_obtained / m.max_marks) * 100)}%)
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No assessments graded yet.</div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default TrainerStudents;
