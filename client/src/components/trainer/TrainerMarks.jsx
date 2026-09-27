import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { Modal } from '../common/Modal.jsx';
import { Award, CheckCircle2, Edit2, Users } from 'lucide-react';

export function TrainerMarks() {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Grade Modal
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);
  const [marksObtained, setMarksObtained] = useState('');
  const [remarks, setRemarks] = useState('');
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const res = await api.getTrainerAssessments();
      if (res.success && res.assessments.length > 0) {
        setAssessments(res.assessments);
        setSelectedAssessmentId(res.assessments[0].id);
        fetchResults(res.assessments[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (assessmentId) => {
    try {
      const res = await api.getAssessmentResults(assessmentId);
      if (res.success) {
        setResultsData(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssessmentChange = (id) => {
    setSelectedAssessmentId(id);
    fetchResults(id);
  };

  const handleOpenGrade = (student) => {
    setTargetStudent(student);
    setMarksObtained(student.marks_obtained !== null ? student.marks_obtained : '');
    setRemarks(student.remarks || '');
    setModalError('');
    setIsGradeOpen(true);
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    try {
      setModalError('');
      const res = await api.enterMarks(selectedAssessmentId, {
        student_id: targetStudent.student_id,
        marks_obtained: parseFloat(marksObtained),
        remarks
      });

      if (res.success) {
        setIsGradeOpen(false);
        setSuccessMsg(`Marks recorded for ${targetStudent.name}.`);
        fetchResults(selectedAssessmentId);
      }
    } catch (err) {
      setModalError(err.message || 'Failed to submit marks.');
    }
  };

  return (
    <div>
      <HelperBanner
        title="Grading Desk & Examination Scoring"
        description="Enter marks, review cohort scores, and provide qualitative feedback to enrolled students."
        tip="Marks are bounded by the maximum point threshold set during assessment creation."
        nextAction="Select an assessment from the dropdown below, then click 'Grade' next to any student."
      />

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          ✔ {successMsg}
        </div>
      )}

      {/* Select Assessment Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">
            <h3>Select Assessment to Evaluate</h3>
            <p>Load registered students in the corresponding course cohort</p>
          </div>
          <span className="badge badge-primary"><Award size={14} /> Evaluation Mode</span>
        </div>

        <div style={{ maxWidth: '420px' }}>
          <select
            className="form-control"
            value={selectedAssessmentId}
            onChange={(e) => handleAssessmentChange(e.target.value)}
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                [{a.course_code}] {a.title} (Max: {a.max_marks} pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Submissions Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h3>
              {resultsData?.assessment?.title} — Student Roster ({resultsData?.students?.length || 0})
            </h3>
            <p>Course: <strong>{resultsData?.assessment?.course_title}</strong> | Maximum Points: <strong>{resultsData?.assessment?.max_marks}</strong></p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student Code</th>
                <th>Student Name</th>
                <th>Score Obtained</th>
                <th>Percentage</th>
                <th>Instructor Feedback</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!resultsData?.students || resultsData.students.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No students enrolled in this course.</td></tr>
              ) : (
                resultsData.students.map((s) => {
                  const max = resultsData.assessment.max_marks;
                  const hasGrade = s.marks_obtained !== null;
                  const pct = hasGrade ? Math.round((s.marks_obtained / max) * 100) : null;

                  return (
                    <tr key={s.student_id}>
                      <td><span className="badge badge-neutral" style={{ fontWeight: 700 }}>{s.student_code}</span></td>
                      <td><strong>{s.name}</strong></td>
                      <td>
                        {hasGrade ? (
                          <strong style={{ fontSize: '1rem', color: pct >= 75 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626' }}>
                            {s.marks_obtained} / {max}
                          </strong>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Not graded</span>
                        )}
                      </td>
                      <td>
                        {hasGrade ? (
                          <span className={`badge ${pct >= 75 ? 'badge-success' : pct >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                            {pct}%
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '280px' }}>
                        {s.remarks || 'No feedback logged yet'}
                      </td>
                      <td>
                        <button
                          onClick={() => handleOpenGrade(s)}
                          className={`btn btn-sm ${hasGrade ? 'btn-outline' : 'btn-primary'}`}
                        >
                          <Edit2 size={13} /> {hasGrade ? 'Update Marks' : 'Enter Marks'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Modal */}
      <Modal
        isOpen={isGradeOpen}
        onClose={() => setIsGradeOpen(false)}
        title={`Enter Marks: ${targetStudent?.name}`}
        footer={(
          <>
            <button type="button" onClick={() => setIsGradeOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" form="grade-form" className="btn btn-primary">Save Marks</button>
          </>
        )}
      >
        {modalError && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>{modalError}</div>}
        <form id="grade-form" onSubmit={handleSaveMarks}>
          <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem' }}>
            <div>Assessment: <strong>{resultsData?.assessment?.title}</strong></div>
            <div>Maximum Score: <strong>{resultsData?.assessment?.max_marks} points</strong></div>
          </div>

          <div className="form-group">
            <label>Points Obtained (0 – {resultsData?.assessment?.max_marks}) *</label>
            <input
              type="number"
              className="form-control"
              step="0.5"
              min="0"
              max={resultsData?.assessment?.max_marks}
              value={marksObtained}
              onChange={(e) => setMarksObtained(e.target.value)}
              placeholder="e.g. 85"
              required
            />
          </div>

          <div className="form-group">
            <label>Constructive Feedback & Remarks</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Provide comments on strengths and areas for improvement..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TrainerMarks;
