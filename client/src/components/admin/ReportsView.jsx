import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { BarChart, DonutChart } from '../common/Charts.jsx';
import { TrendingUp, Award, CalendarCheck, Users, Download } from 'lucide-react';

export function ReportsView() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminReports();
      if (res.success) {
        setReports(res.reports);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Generating institutional reports...</div>;
  }

  const courseChartData = (reports?.courses || []).map((c) => ({
    label: c.code,
    value: c.enrolled_students || 0,
    color: '#4f46e5'
  }));

  const att = reports?.attendance || {};
  const totalAtt = att.total_records || 1;
  const presentPct = Math.round(((att.present_count || 0) / totalAtt) * 100);

  return (
    <div>
      <HelperBanner
        title="Executive Performance & Analytics Reports"
        description="Comprehensive analysis of cohort progression, assessment scoring distributions, and attendance integrity."
        tip="These metrics can be used for accreditation, student retention monitoring, and curriculum optimization."
        nextAction="Review the course enrollment distribution and scoring benchmarks below."
      />

      {/* KPI Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ margin: 0, padding: '18px' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Average Exam Score</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>
            {reports?.performance?.averageScorePct || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            Range: {reports?.performance?.minScorePct}% min – {reports?.performance?.maxScorePct}% max
          </div>
        </div>

        <div className="card" style={{ margin: 0, padding: '18px' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Submissions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0ea5e9', marginTop: '4px' }}>
            {reports?.performance?.totalSubmissions || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            Evaluated by instructors
          </div>
        </div>

        <div className="card" style={{ margin: 0, padding: '18px' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Present Rate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {presentPct}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            {att.present_count || 0} of {att.total_records || 0} sessions
          </div>
        </div>

        <div className="card" style={{ margin: 0, padding: '18px' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Absent & Late Total</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            {(att.absent_count || 0) + (att.late_count || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            {att.late_count || 0} late, {att.absent_count || 0} absent
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Course Enrollment Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <h3>Enrolled Students per Course</h3>
              <p>Cohort capacity breakdown across curriculums</p>
            </div>
          </div>
          <BarChart data={courseChartData} height={200} color="#4f46e5" />
        </div>

        {/* Attendance Donut */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card-header" style={{ width: '100%' }}>
            <div className="card-title">
              <h3>Attendance Compliance</h3>
              <p>Present sessions vs Total scheduled lectures</p>
            </div>
          </div>
          <DonutChart
            percentage={presentPct}
            size={180}
            color="#10b981"
            label="Present Sessions"
          />
          <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
            <span>🟢 Present: {att.present_count || 0}</span>
            <span>🟡 Late: {att.late_count || 0}</span>
            <span>🔴 Absent: {att.absent_count || 0}</span>
          </div>
        </div>
      </div>

      {/* Course Summary Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h3>Curriculum Summary Metrics</h3>
            <p>Comprehensive overview of course readiness and participation</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Title</th>
                <th>Status</th>
                <th>Enrolled Students</th>
                <th>Allocated Trainers</th>
                <th>Syllabus Modules</th>
              </tr>
            </thead>
            <tbody>
              {(reports?.courses || []).map((c) => (
                <tr key={c.id}>
                  <td><span className="badge badge-primary">{c.code}</span></td>
                  <td><strong>{c.title}</strong></td>
                  <td><span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>{c.status}</span></td>
                  <td><strong>{c.enrolled_students}</strong> students</td>
                  <td>{c.assigned_trainers} instructor(s)</td>
                  <td>{c.total_modules} modules</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReportsView;
