import React, { useState } from 'react';
import { 
  GraduationCap, 
  Menu, 
  X, 
  FileText, 
  UserCheck, 
  ShieldAlert, 
  Home, 
  LogIn,
  LogOut,
  User,
  ShieldCheck
} from 'lucide-react';
import { COLLEGE_INFO } from '../data/fictionalData';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentView, setCurrentView }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  // Role-based navigation links: Users see only pages authorized for their role
  const getNavLinks = () => {
    if (!isAuthenticated || !user) {
      return [
        { id: 'landing', label: 'Home', icon: Home },
        { id: 'login', label: 'Student Login', icon: LogIn },
      ];
    }

    if (user.role === 'Student') {
      return [
        { id: 'landing', label: 'Home', icon: Home },
        { id: 'student', label: 'Student Dashboard', icon: GraduationCap },
      ];
    }

    if (user.role === 'Faculty') {
      return [
        { id: 'landing', label: 'Home', icon: Home },
        { id: 'faculty', label: 'Faculty Dashboard', icon: UserCheck },
      ];
    }

    if (user.role === 'Admin') {
      return [
        { id: 'landing', label: 'Home', icon: Home },
        { id: 'admin', label: 'COE / Admin Dashboard', icon: ShieldAlert },
      ];
    }

    return [{ id: 'landing', label: 'Home', icon: Home }];
  };

  const navLinks = getNavLinks();

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setCurrentView('landing');
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs no-print">
      {/* Top Academic Ribbon */}
      <div className="bg-blue-900 text-blue-100 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="font-semibold text-white tracking-wide">
              {COLLEGE_INFO.trustName}
            </span>
            <span className="hidden md:inline text-blue-300">|</span>
            <span className="hidden md:inline text-blue-200">
              Autonomous Institute under SPPU
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="bg-blue-800/80 text-blue-100 px-2 py-0.5 rounded font-mono">
              Academic Session: 2026–27
            </span>
            <span className="hidden sm:inline text-blue-200">
              Exam Cell: examcell@sanjivani.edu.in
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:bg-blue-800 transition-colors">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-blue-950 text-base sm:text-lg tracking-tight uppercase">
                  SANJIVANI COE
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                  RMS
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Autonomous Result Management System
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentView === link.id || (link.id === 'login' && currentView.startsWith('login'));

              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-blue-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* User Auth Status / Logout Button */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1 max-w-[140px]">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {user.prn || user.employeeId || user.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log Out"
                  className="p-2 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Student Login</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-1 shadow-lg">
          {isAuthenticated && user && (
            <div className="p-3 bg-blue-50 rounded-lg mb-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-950 block">{user.name}</span>
                <span className="text-[11px] text-blue-700 font-medium">Role: {user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}

          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
            Navigation Menu
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentView === link.id || (link.id === 'login' && currentView.startsWith('login'));

            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-blue-900 text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
