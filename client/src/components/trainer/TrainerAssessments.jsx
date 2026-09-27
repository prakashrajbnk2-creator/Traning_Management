import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { Modal } from '../common/Modal.jsx';
import { FileText, Plus, Users, Calendar, Award, CheckCircle2 } from 'lucide-react';

export function TrainerAssessments({ setTab }) {
  const [assessments, setAssessments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    max_marks: 100,
    due_date: ''
  });

  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [aRes, cRes] = await Promise.all([
        api.getTrainerAssessments(),
        api.getTrainerCourses()
      ]);

      if (aRes.success) setAssessments(aRes.assessments);
      if (cRes.success) {
        setCourses(cRes.courses);
        if (cRes.courses[0]) {
          setFormData(prev => ({ ...prev, course_id: cRes.courses[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setModalError('');
      const res = await api.createAssessment(formData);
      if (res.success) {
        setIsAddOpen(false);
        setSuccessMsg(`Assessment "${formData.title}" created successfully.`);
        loadData();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to create assessment.');
    }
  };

  return (
    <div>
      <HelperBanner
        title="Assessment Design & Examinations"
        description="Create evaluation tasks, quizzes, and project milestones for your assigned curricula."
        tip="Once created, you can enter marks and feedback for students in the 'Marks Entry' tab."
        nextAction="Click '+ Create Assessment' to schedule a new examination."
      />

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          ✔ {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Curriculum Assessments ({assessments.length})</h3>
        <button onClick={() => setIsAddOpen(true)} className="btn btn-primary">
          <Plus size={16} /> + Create Assessment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading assessments...</div>
        ) : assessments.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No assessments created yet. Click '+ Create Assessment' to add one.</div>
        ) : (
          assessments.map((a) => (
            <div key={a.id} className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span className="badge badge-primary">{a.course_code}</span>
                  <span className="badge badge-neutral">Max: {a.max_marks} pts</span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{a.title}</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '14px' }}>
                  {a.description || 'Evaluation assignment'}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '14px', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> Due: {a.due_date || 'No deadline'}
                  </span>
                  <span style={{ fontWeight: 600, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={13} /> {a.submissions_count} Graded
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setTab('marks')} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                    <Award size={14} /> Grade & Enter Marks
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Assessment Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Schedule New Assessment"
        footer={(
          <>
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" form="add-assessment-form" className="btn btn-primary">+ Create Assessment</button>
          </>
        )}
      >
        {modalError && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>{modalError}</div>}
        <form id="add-assessment-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Target Course *</label>
            <select
              className="form-control"
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              required
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Assessment Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Midterm Practical Examination"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Instructions & Description</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Specify requirements, submission guidelines, or rubrics..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Maximum Marks (Points) *</label>
              <input
                type="number"
                className="form-control"
                value={formData.max_marks}
                onChange={(e) => setFormData({ ...formData, max_marks: parseFloat(e.target.value) || 100 })}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TrainerAssessments;
