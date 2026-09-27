import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { UserCheck, GraduationCap, ArrowRight, Trash2 } from 'lucide-react';

export function EnrollmentsView() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [trainerCourseId, setTrainerCourseId] = useState('');

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentCourseId, setStudentCourseId] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [cRes, sRes, tRes] = await Promise.all([
        api.getAllCourses(),
        api.getAllStudents(),
        api.getAllTrainers()
      ]);

      if (cRes.success) {
        setCourses(cRes.courses);
        if (cRes.courses[0]) {
          setTrainerCourseId(cRes.courses[0].id);
          setStudentCourseId(cRes.courses[0].id);
        }
      }
      if (sRes.success) {
        setStudents(sRes.students);
        if (sRes.students[0]) setSelectedStudentId(sRes.students[0].id);
      }
      if (tRes.success) {
        setTrainers(tRes.trainers);
        if (tRes.trainers[0]) setSelectedTrainerId(tRes.trainers[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTrainer = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await api.assignTrainer({ trainer_id: parseInt(selectedTrainerId, 10), course_id: parseInt(trainerCourseId, 10) });
      if (res.success) {
        setMessage('Faculty member successfully assigned to instruct course.');
        loadAll();
      }
    } catch (err) {
      setError(err.message || 'Failed to assign trainer.');
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await api.enrollStudent({ student_id: parseInt(selectedStudentId, 10), course_id: parseInt(studentCourseId, 10) });
      if (res.success) {
        setMessage('Student successfully enrolled into course.');
        loadAll();
      }
    } catch (err) {
      setError(err.message || 'Failed to enroll student.');
    }
  };

  return (
    <div>
      <HelperBanner
        title="Curriculum Allocation & Enrollment Hub"
        description="Allocate faculty instructors to courses and enroll student cohorts into active academic tracks."
        tip="Once assigned, trainers will automatically gain permissions to mark attendance and grade assessments for enrolled students."
        nextAction="Choose a student and course below to confirm enrollment."
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Enroll Student Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <h3>Enroll Student into Course</h3>
              <p>Admit a student to a training curriculum</p>
            </div>
            <div className="badge badge-primary"><GraduationCap size={14} /> Student</div>
          </div>

          <form onSubmit={handleEnrollStudent}>
            <div className="form-group">
              <label>Select Student</label>
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

            <div className="form-group">
              <label>Select Target Course</label>
              <select
                className="form-control"
                value={studentCourseId}
                onChange={(e) => setStudentCourseId(e.target.value)}
                required
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.title}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              <span>Confirm Student Enrollment</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Assign Trainer Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <h3>Assign Faculty to Course</h3>
              <p>Authorize an instructor to manage and grade a course</p>
            </div>
            <div className="badge badge-success"><UserCheck size={14} /> Faculty</div>
          </div>

          <form onSubmit={handleAssignTrainer}>
            <div className="form-group">
              <label>Select Trainer</label>
              <select
                className="form-control"
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                required
              >
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.trainer_code} - {t.specialization || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Course to Instruct</label>
              <select
                className="form-control"
                value={trainerCourseId}
                onChange={(e) => setTrainerCourseId(e.target.value)}
                required
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.title}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', background: '#059669' }}>
              <span>Confirm Faculty Assignment</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EnrollmentsView;
