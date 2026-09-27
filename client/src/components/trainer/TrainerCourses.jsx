import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { BookOpen, Layers } from 'lucide-react';

export function TrainerCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getTrainerCourses();
      if (res.success) {
        setCourses(res.courses);
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
        title="Your Assigned Curriculums"
        description="Courses you are formally authorized to instruct, schedule examinations for, and evaluate."
        tip="Course allocations are managed by administrators. Contact administration if an assignment is missing."
        nextAction="Select an assessment or attendance tab to manage student evaluations in these courses."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading courses...</div>
        ) : courses.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No courses currently assigned to you.</div>
        ) : (
          courses.map((c) => (
            <div key={c.id} className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge badge-primary">{c.code}</span>
                  <span className="badge badge-success">ACTIVE INSTRUCTION</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{c.title}</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                  {c.description || 'Instructional curriculum'}
                </p>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={14} /> Full Syllabus Access
                </span>
                <span style={{ fontWeight: 600, color: '#0ea5e9' }}>Cohort Open</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TrainerCourses;
