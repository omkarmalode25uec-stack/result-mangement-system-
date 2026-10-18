import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import RoleLoginPage from './pages/RoleLoginPage';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MarksheetPreview from './pages/MarksheetPreview';
import { AuthProvider, useAuth } from './context/AuthContext';

function MainApp() {
  const [currentView, setCurrentView] = useState('landing');
  const [selectedPrn, setSelectedPrn] = useState('22UCO01042');
  const { user } = useAuth();

  // If a student logs in, sync selectedPrn to their PRN
  useEffect(() => {
    if (user && user.role === 'Student' && user.prn) {
      setSelectedPrn(user.prn);
    }
  }, [user]);

  // Scroll to top on page navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      {/* Top Academic Navigation */}
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
      />

      {/* Main Routed Page Canvas */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage 
            setCurrentView={setCurrentView} 
            setSelectedPrn={setSelectedPrn} 
          />
        )}

        {currentView === 'login' && (
          <RoleLoginPage 
            setCurrentView={setCurrentView} 
            setSelectedPrn={setSelectedPrn} 
          />
        )}

        {currentView === 'student' && (
          <StudentDashboard 
            setCurrentView={setCurrentView} 
            selectedPrn={selectedPrn} 
            setSelectedPrn={setSelectedPrn} 
          />
        )}

        {currentView === 'faculty' && (
          <FacultyDashboard 
            setCurrentView={setCurrentView} 
            setSelectedPrn={setSelectedPrn} 
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard 
            setCurrentView={setCurrentView} 
            setSelectedPrn={setSelectedPrn} 
          />
        )}

        {currentView === 'marksheet' && (
          <MarksheetPreview 
            setCurrentView={setCurrentView} 
            selectedPrn={selectedPrn} 
            setSelectedPrn={setSelectedPrn} 
          />
        )}
      </main>

      {/* Institutional Academic Footer */}
      <Footer setCurrentView={setCurrentView} />
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
