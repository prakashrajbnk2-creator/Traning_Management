import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  GraduationCap,
  CalendarCheck,
  FileText,
  BarChart3,
  Megaphone,
  Settings,
  LogOut,
  Award,
  TrendingUp,
  FileCheck,
  X
} from 'lucide-react';

export function Sidebar({ currentTab, setTab, isOpen, setIsOpen }) {
  const { user, role, logout } = useAuth();

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'trainers', label: 'Trainers', icon: UserCheck },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'enrollments', label: 'Enrollments', icon: GraduationCap },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'assessments', label: 'Assessments', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const trainerNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'My Students', icon: Users },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'assessments', label: 'Assessments', icon: FileText },
    { id: 'marks', label: 'Marks', icon: Award },
    { id: 'progress', label: 'Progress', icon: TrendingUp }
  ];

  const studentNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'assessments', label: 'Assessments & Marks', icon: FileCheck },
    { id: 'announcements', label: 'Announcements', icon: Megaphone }
  ];

  const navItems = role === 'ADMIN' ? adminNav : role === 'TRAINER' ? trainerNav : studentNav;

  const handleSelectTab = (tabId) => {
    setTab(tabId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 35
          }}
          className="lg:hidden"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand header */}
        <div className="sidebar-header">
          <div className="brand-icon">🎓</div>
          <div className="brand-text" style={{ flex: 1 }}>
            <h1>TMS Enterprise</h1>
            <p>Training Management</p>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setIsOpen(false)}
            style={{ color: '#94a3b8', padding: '4px' }}
            className="lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <div className="name">{user?.name || 'User'}</div>
              <div className="role-tag">{role} PORTAL</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="btn btn-ghost"
              style={{ color: '#ef4444', padding: '6px' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
