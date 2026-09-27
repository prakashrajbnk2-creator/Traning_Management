import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Menu, LogOut, ArrowRightLeft, Shield, User, GraduationCap } from 'lucide-react';

export function Topbar({ currentTab, onToggleSidebar }) {
  const { user, role, logout, login } = useAuth();

  const getPageInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return { title: `${role.charAt(0) + role.slice(1).toLowerCase()} Overview`, subtitle: 'Monitor KPIs, assignments, and real-time operations' };
      case 'students':
        return { title: 'Student Management', subtitle: 'View records, assign courses, track progress and attendance' };
      case 'trainers':
        return { title: 'Faculty & Trainers', subtitle: 'Manage instructor workloads and course allocations' };
      case 'courses':
        return { title: 'Course Offerings', subtitle: 'Curriculum development, syllabus modules, and enrollments' };
      case 'enrollments':
        return { title: 'Student Enrollments', subtitle: 'Allocate students and trainers to training programs' };
      case 'attendance':
        return { title: 'Attendance Tracking', subtitle: 'Real-time session records and verification logs' };
      case 'assessments':
        return { title: 'Assessments & Examinations', subtitle: 'Create quizzes, assignments, and review results' };
      case 'marks':
        return { title: 'Grading & Marks Entry', subtitle: 'Enter student marks and constructive feedback' };
      case 'progress':
        return { title: 'Syllabus Progress Tracker', subtitle: 'Module completion rates across cohorts' };
      case 'reports':
        return { title: 'Executive Reports & Analytics', subtitle: 'System performance, attendance rates, and workload metrics' };
      case 'announcements':
        return { title: 'Announcements Board', subtitle: 'Publish notices to students and training staff' };
      case 'settings':
        return { title: 'System Configuration', subtitle: 'Platform parameters and relational database status' };
      default:
        return { title: 'Dashboard', subtitle: 'Training Management System' };
    }
  };

  const { title, subtitle } = getPageInfo();

  const handleQuickSwitch = async (email, pass) => {
    try {
      await login(email, pass);
    } catch (e) {
      console.error('Quick switch error:', e);
    }
  };

  const getRoleBadgeClass = () => {
    if (role === 'ADMIN') return 'badge-primary';
    if (role === 'TRAINER') return 'badge-success';
    return 'badge-neutral';
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          onClick={onToggleSidebar}
          className="btn btn-ghost"
          style={{ padding: '8px', marginRight: '4px' }}
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>
        <div className="topbar-title">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        {/* Quick Demo Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowRightLeft size={13} /> Switch Role:
          </span>
          <button
            onClick={() => handleQuickSwitch('admin@tms.com', 'Admin@123')}
            className={`btn btn-sm ${role === 'ADMIN' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
          >
            Admin
          </button>
          <button
            onClick={() => handleQuickSwitch('john@tms.com', 'Trainer@123')}
            className={`btn btn-sm ${role === 'TRAINER' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
          >
            Trainer
          </button>
          <button
            onClick={() => handleQuickSwitch('alice@tms.com', 'Student@123')}
            className={`btn btn-sm ${role === 'STUDENT' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
          >
            Student
          </button>
        </div>

        {/* Role Badge */}
        <span className={`badge ${getRoleBadgeClass()}`}>
          {role === 'ADMIN' && <Shield size={13} />}
          {role === 'TRAINER' && <User size={13} />}
          {role === 'STUDENT' && <GraduationCap size={13} />}
          {role}
        </span>

        {/* User name & logout */}
        <button
          onClick={logout}
          className="btn btn-outline btn-sm"
          style={{ gap: '6px' }}
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;
