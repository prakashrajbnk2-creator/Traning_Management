import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { MetricCard } from '../common/MetricCard.jsx';
import { BarChart, DonutChart } from '../common/Charts.jsx';
import { Users, UserCheck, BookOpen, CalendarCheck, TrendingUp, Plus, ArrowUpRight } from 'lucide-react';

export function AdminDashboard({ setTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard();
      if (res.success) {
        setData(res.dashboard);
      }
    } catch (err) {
      setError(err.message || 'Failed to load admin metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading dashboard analytics...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', background: '#fef2f2', color: '#dc2626', borderRadius: '10px' }}>{error}</div>;
  }

  // Workload chart data
  const workloadChartData = (data?.trainerWorkload || []).map(t => ({
    label: t.trainer_name?.split(' ')[0] || t.trainer_code,
    value: t.students_taught || 0,
    color: '#0ea5e9'
  }));

  return (
    <div>
      {/* Beginner Guide Banner */}
      <HelperBanner
        title="Admin Central Command"
        description="This dashboard provides an executive overview of enrollment metrics, faculty workload, attendance health, and course completions across the institution."
        tip="Use the sidebar on the left or the quick action buttons below to manage students, assign courses, and configure academic terms."
        nextAction="Check students needing attention or view comprehensive reports."
      />

      {/* Quick Action Shortcuts */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button onClick={() => setTab('students')} className="btn btn-primary btn-sm">
          <Plus size={16} /> + Add Student
        </button>
        <button onClick={() => setTab('courses')} className="btn btn-outline btn-sm">
          <Plus size={16} /> + Create Course
        </button>
        <button onClick={() => setTab('enrollments')} className="btn btn-outline btn-sm">
          <UserCheck size={16} /> Assign Trainer / Enroll
        </button>
        <button onClick={() => setTab('reports')} className="btn btn-outline btn-sm">
          <TrendingUp size={16} /> Generate Reports
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Students"
          value={data?.totalStudents || 0}
          subtext={`${data?.activeStudents || 0} currently active`}
          icon={Users}
          color="#4f46e5"
          bgLight="#eef2ff"
        />
        <MetricCard
          title="Total Faculty"
          value={data?.totalTrainers || 0}
          subtext={`${data?.activeTrainers || 0} instructing courses`}
          icon={UserCheck}
          color="#0ea5e9"
          bgLight="#f0f9ff"
        />
        <MetricCard
          title="Active Courses"
          value={data?.totalCourses || 0}
          subtext={`${data?.activeCourses || 0} open for enrollment`}
          icon={BookOpen}
          color="#8b5cf6"
          bgLight="#f5f3ff"
        />
        <MetricCard
          title="Avg Attendance"
          value={`${data?.averageAttendance || 0}%`}
          subtext="Across all course cohorts"
          icon={CalendarCheck}
          color="#10b981"
          bgLight="#ecfdf5"
        />
        <MetricCard
          title="Avg Completion"
          value={`${data?.averageCompletion || 0}%`}
          subtext="Syllabus progress index"
          icon={TrendingUp}
          color="#f59e0b"
          bgLight="#fffbeb"
        />
      </div>

      {/* Visual Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Completion Donut */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card-header" style={{ width: '100%' }}>
            <div className="card-title">
              <h3>Institutional Completion Rate</h3>
              <p>Percentage of modules completed by enrolled students</p>
            </div>
          </div>
          <DonutChart
            percentage={data?.averageCompletion || 0}
            size={180}
            color="#4f46e5"
            label="Avg Completion"
          />
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
            Benchmark target is <strong>75%</strong> by term end.
          </div>
        </div>

        {/* Trainer Workload Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <h3>Faculty Teaching Workload</h3>
              <p>Active student headcount allocated per instructor</p>
            </div>
          </div>
          <BarChart data={workloadChartData} xKey="label" yKey="value" height={190} color="#0ea5e9" />
        </div>
      </div>

      {/* Trainer Workload Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h3>Faculty Workload Breakdown</h3>
            <p>Courses assigned, students instructed, and assessments created</p>
          </div>
          <button onClick={() => setTab('trainers')} className="btn btn-outline btn-sm">
            <span>Manage All Faculty</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Trainer Name</th>
                <th>Code</th>
                <th>Specialization</th>
                <th>Courses Assigned</th>
                <th>Students Instructed</th>
                <th>Assessments</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(data?.trainerWorkload || []).map((t) => (
                <tr key={t.trainer_id}>
                  <td><strong>{t.trainer_name}</strong></td>
                  <td><span className="badge badge-neutral">{t.trainer_code}</span></td>
                  <td>{t.specialization}</td>
                  <td>{t.courses_assigned} courses</td>
                  <td><strong style={{ color: '#0ea5e9' }}>{t.students_taught}</strong> students</td>
                  <td>{t.assessments_created}</td>
                  <td>
                    <button onClick={() => setTab('enrollments')} className="btn btn-outline btn-sm">
                      Assign Course
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
