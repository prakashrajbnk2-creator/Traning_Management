import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { FileText, Award, Calendar, Users } from 'lucide-react';

export function AssessmentsView() {
  const [assessments, setAssessments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseFilter, setCourseFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    fetchAssessments();
  }, [courseFilter]);

  const fetchCourses = async () => {
    try {
      const res = await api.getAllCourses();
      if (res.success) setCourses(res.courses);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (courseFilter) params.append('course_id', courseFilter);
      const res = await api.getAllAssessments(params.toString());
      if (res.success) {
        setAssessments(res.assessments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <HelperBanner
        title="Institutional Assessments & Examinations"
        description="Monitor examination schedules, evaluation deadlines, and aggregate student grading benchmarks."
        tip="Instructors create and grade assessments for their assigned courses. Admins maintain full visibility."
        nextAction="Filter by course to inspect specific module examinations."
      />

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="card-title">
            <h3>Registered Assessments ({assessments.length})</h3>
            <p>Evaluation records and performance averages</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
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
            {courseFilter && (
              <button onClick={() => setCourseFilter('')} className="btn btn-outline btn-sm">Clear Filter</button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Assessment Title</th>
                <th>Course</th>
                <th>Instructor</th>
                <th>Max Marks</th>
                <th>Submissions</th>
                <th>Avg Score</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading assessments...</td></tr>
              ) : assessments.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No assessments scheduled.</td></tr>
              ) : (
                assessments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.title}</strong>
                      {a.description && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.description}</div>}
                    </td>
                    <td><span className="badge badge-primary">{a.course_code}</span></td>
                    <td>{a.trainer_name}</td>
                    <td><strong>{a.max_marks}</strong> pts</td>
                    <td>
                      <span className="badge badge-neutral"><Users size={12} /> {a.submissions_count} submissions</span>
                    </td>
                    <td>
                      {a.avg_marks_obtained !== null ? (
                        <strong style={{ color: a.avg_marks_obtained >= 75 ? '#059669' : '#d97706' }}>
                          {Math.round(a.avg_marks_obtained)} / {a.max_marks} ({Math.round((a.avg_marks_obtained / a.max_marks) * 100)}%)
                        </strong>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Ungraded</span>
                      )}
                    </td>
                    <td>{a.due_date || 'Ongoing'}</td>
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

export default AssessmentsView;
