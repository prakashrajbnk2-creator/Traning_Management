import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export function TrainerProgress() {
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const res = await api.getTrainerProgress();
      if (res.success) {
        setProgressList(res.progress);
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
        title="Cohort Syllabus Progress Monitor"
        description="Track how each student is moving through sequential curriculum modules."
        tip="Progress is calculated in real-time as students complete syllabus learning units."
        nextAction="Identify any students whose module completions are lagging behind schedule."
      />

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h3>Student Module Completion Status ({progressList.length})</h3>
            <p>Breakdown of completed vs remaining topics</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Modules Completed</th>
                <th>Modules Remaining</th>
                <th>Overall Progress</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading progress telemetry...</td></tr>
              ) : progressList.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No active progress data available.</td></tr>
              ) : (
                progressList.map((p, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{p.studentName}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.studentCode}</div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{p.courseCode}</span> {p.courseTitle}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> {p.completedModules} of {p.totalModules}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        <Clock size={12} /> {p.remainingModules} remaining
                      </span>
                    </td>
                    <td style={{ minWidth: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="progress-bar-bg" style={{ flex: 1 }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${p.completionPercentage}%`,
                              background: p.completionPercentage >= 75 ? '#10b981' : p.completionPercentage >= 40 ? '#0ea5e9' : '#f59e0b'
                            }}
                          />
                        </div>
                        <strong style={{ fontSize: '0.85rem' }}>{p.completionPercentage}%</strong>
                      </div>
                    </td>
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

export default TrainerProgress;
