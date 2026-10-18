import React, { useState } from 'react';
import { 
  GraduationCap, 
  Menu, 
  X, 
  FileText, 
  UserCheck, 
  ShieldAlert, 
  Layers, 
  Home, 
  LogIn,
  ChevronDown
} from 'lucide-react';
import { COLLEGE_INFO } from '../data/fictionalData';

export default function Navbar({ currentView, setCurrentView, currentRole, setCurrentRole }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'login', label: 'Portal Access', icon: LogIn },
    { id: 'student', label: 'Student Portal', icon: GraduationCap },
    { id: 'faculty', label: 'Faculty Portal', icon: UserCheck },
    { id: 'admin', label: 'COE / Admin', icon: ShieldAlert },
    { id: 'marksheet', label: 'Marksheet Preview', icon: FileText, highlight: true },
  ];

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
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
              Academic Session: 2024-2025
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
            {/* Visual Logo Placeholder */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:bg-blue-800 transition-colors">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-blue-950 text-base sm:text-lg tracking-tight uppercase">
                  SANJIVANI COE
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                  RMS Portal
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
              const isActive = currentView === link.id;

              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-900 text-white shadow-xs'
                      : link.highlight
                      ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                      : 'text-slate-700 hover:text-blue-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : link.highlight ? 'text-blue-700' : 'text-slate-500'}`} />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Role Switcher / Indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                Current Mode
              </span>
              <span className="text-xs font-bold text-blue-900 capitalize bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {currentView === 'marksheet' ? 'Statement Preview' : `${currentView} View`}
              </span>
            </div>
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
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
            Navigation Menu
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentView === link.id;

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
                {link.highlight && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                    Official Format
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
