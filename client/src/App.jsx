import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Login } from './components/auth/Login.jsx';
import { Sidebar } from './components/common/Sidebar.jsx';
import { Topbar } from './components/common/Topbar.jsx';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard.jsx';
import { StudentManagement } from './components/admin/StudentManagement.jsx';
import { TrainerManagement } from './components/admin/TrainerManagement.jsx';
import { CourseManagement } from './components/admin/CourseManagement.jsx';
import { EnrollmentsView } from './components/admin/EnrollmentsView.jsx';
import { AttendanceView } from './components/admin/AttendanceView.jsx';
import { AssessmentsView } from './components/admin/AssessmentsView.jsx';
import { ReportsView } from './components/admin/ReportsView.jsx';
import { AnnouncementsView } from './components/admin/AnnouncementsView.jsx';
import { SettingsView } from './components/admin/SettingsView.jsx';

// Trainer Views
import { TrainerDashboard } from './components/trainer/TrainerDashboard.jsx';
import { TrainerStudents } from './components/trainer/TrainerStudents.jsx';
import { TrainerCourses } from './components/trainer/TrainerCourses.jsx';
import { TrainerAttendance } from './components/trainer/TrainerAttendance.jsx';
import { TrainerAssessments } from './components/trainer/TrainerAssessments.jsx';
import { TrainerMarks } from './components/trainer/TrainerMarks.jsx';
import { TrainerProgress } from './components/trainer/TrainerProgress.jsx';

// Student Views
import { StudentDashboard } from './components/student/StudentDashboard.jsx';
import { StudentCourses } from './components/student/StudentCourses.jsx';
import { StudentAttendance } from './components/student/StudentAttendance.jsx';
import { StudentAssessments } from './components/student/StudentAssessments.jsx';

function MainApp() {
  const { user, role, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎓</div>
          <div style={{ fontWeight: 600 }}>Loading Training Management System...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Render view depending on role and currentTab
  const renderCurrentView = () => {
    if (role === 'ADMIN') {
      switch (currentTab) {
        case 'dashboard': return <AdminDashboard setTab={setCurrentTab} />;
        case 'students': return <StudentManagement />;
        case 'trainers': return <TrainerManagement />;
        case 'courses': return <CourseManagement />;
        case 'enrollments': return <EnrollmentsView />;
        case 'attendance': return <AttendanceView />;
        case 'assessments': return <AssessmentsView />;
        case 'reports': return <ReportsView />;
        case 'announcements': return <AnnouncementsView />;
        case 'settings': return <SettingsView />;
        default: return <AdminDashboard setTab={setCurrentTab} />;
      }
    } else if (role === 'TRAINER') {
      switch (currentTab) {
        case 'dashboard': return <TrainerDashboard setTab={setCurrentTab} />;
        case 'students': return <TrainerStudents />;
        case 'courses': return <TrainerCourses />;
        case 'attendance': return <TrainerAttendance />;
        case 'assessments': return <TrainerAssessments setTab={setCurrentTab} />;
        case 'marks': return <TrainerMarks />;
        case 'progress': return <TrainerProgress />;
        default: return <TrainerDashboard setTab={setCurrentTab} />;
      }
    } else if (role === 'STUDENT') {
      switch (currentTab) {
        case 'dashboard': return <StudentDashboard setTab={setCurrentTab} />;
        case 'courses': return <StudentCourses />;
        case 'attendance': return <StudentAttendance />;
        case 'assessments': return <StudentAssessments />;
        case 'announcements': return <AnnouncementsView />;
        default: return <StudentDashboard setTab={setCurrentTab} />;
      }
    }

    return <div>Role not recognized.</div>;
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        setTab={setCurrentTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className="main-wrapper">
        <Topbar
          currentTab={currentTab}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="content-area">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
