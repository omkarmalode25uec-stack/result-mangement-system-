import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import RoleLoginPage from './pages/RoleLoginPage';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

function getViewFromPath(pathname) {
  const clean = (pathname || window.location.pathname || '/').toLowerCase().replace(/\/$/, '') || '/';
  if (clean === '/' || clean === '/home') return 'landing';
  if (clean === '/coe-admin/login' || clean === '/admin/login') return 'login-admin';
  if (clean === '/faculty/login' || clean === '/faculty-login') return 'login-faculty';
  if (clean === '/login' || clean === '/student/login' || clean === '/student-login') return 'login-student';
  if (clean === '/student') return 'student';
  if (clean === '/faculty') return 'faculty';
  if (clean === '/admin' || clean === '/coe-admin') return 'admin';
  return 'landing';
}

function getPathFromView(view) {
  if (view === 'landing') return '/';
  if (view === 'login' || view === 'login-student') return '/login';
  if (view === 'login-faculty') return '/faculty/login';
  if (view === 'login-admin') return '/coe-admin/login';
  if (view === 'student') return '/student';
  if (view === 'faculty') return '/faculty';
  if (view === 'admin') return '/admin';
  return '/';
}

function MainApp() {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentViewInternal] = useState(() => getViewFromPath(window.location.pathname));

  const navigate = useCallback((view) => {
    let resolvedView = view;
    if (view === 'login') resolvedView = 'login-student';
    
    const targetPath = getPathFromView(resolvedView);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setCurrentViewInternal(resolvedView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen for browser forward/back buttons
  useEffect(() => {
    const handlePopState = () => {
      const v = getViewFromPath(window.location.pathname);
      setCurrentViewInternal(v);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Role-based route guard enforcement
  useEffect(() => {
    if (loading) return;

    // 1. Student route protection
    if (currentView === 'student') {
      if (!isAuthenticated || !user) {
        navigate('login-student');
      } else if (user.role !== 'Student') {
        // Redirect faculty or admin to their authorized dashboard
        if (user.role === 'Faculty') navigate('faculty');
        else if (user.role === 'Admin') navigate('admin');
      }
    }

    // 2. Faculty route protection
    if (currentView === 'faculty') {
      if (!isAuthenticated || !user) {
        navigate('login-faculty');
      }
    }

    // 3. Admin route protection
    if (currentView === 'admin') {
      if (!isAuthenticated || !user) {
        navigate('login-admin');
      }
    }

    // 4. If logged in, redirect from login pages to authorized dashboard
    if (isAuthenticated && user) {
      if (currentView === 'login-student' && user.role === 'Student') {
        navigate('student');
      } else if (currentView === 'login-faculty' && user.role === 'Faculty') {
        navigate('faculty');
      } else if (currentView === 'login-admin' && user.role === 'Admin') {
        navigate('admin');
      }
    }
  }, [currentView, isAuthenticated, user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Check role authorization violations for direct URL access attempts
  const isUnauthorizedAdminAccess = currentView === 'admin' && isAuthenticated && user?.role !== 'Admin';
  const isUnauthorizedFacultyAccess = currentView === 'faculty' && isAuthenticated && user?.role !== 'Faculty';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      {/* Top Academic Navigation */}
      <Navbar 
        currentView={currentView} 
        setCurrentView={navigate} 
      />

      {/* Main Routed Page Canvas */}
      <main className="flex-1">
        {/* Access Denied View for Unauthorized Direct Navigation */}
        {(isUnauthorizedAdminAccess || isUnauthorizedFacultyAccess) ? (
          <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-serif">
              Access Restricted
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              You are signed in as <strong className="text-slate-900">{user?.name}</strong> with role <span className="font-bold text-blue-900 uppercase">[{user?.role}]</span>. You are not authorized to access this resource.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  if (user?.role === 'Student') navigate('student');
                  else if (user?.role === 'Faculty') navigate('faculty');
                  else navigate('admin');
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Authorized Dashboard</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentView === 'landing' && (
              <LandingPage setCurrentView={navigate} />
            )}

            {currentView === 'login-student' && (
              <RoleLoginPage 
                setCurrentView={navigate} 
                targetRole="student" 
              />
            )}

            {currentView === 'login-faculty' && (
              <RoleLoginPage 
                setCurrentView={navigate} 
                targetRole="faculty" 
              />
            )}

            {currentView === 'login-admin' && (
              <RoleLoginPage 
                setCurrentView={navigate} 
                targetRole="admin" 
              />
            )}

            {currentView === 'student' && isAuthenticated && user?.role === 'Student' && (
              <StudentDashboard />
            )}

            {currentView === 'faculty' && isAuthenticated && user?.role === 'Faculty' && (
              <FacultyDashboard 
                setCurrentView={navigate} 
              />
            )}

            {currentView === 'admin' && isAuthenticated && user?.role === 'Admin' && (
              <AdminDashboard 
                setCurrentView={navigate} 
              />
            )}
          </>
        )}
      </main>

      {/* Institutional Academic Footer */}
      <Footer setCurrentView={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
