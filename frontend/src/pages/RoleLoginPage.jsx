import React, { useState } from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  ShieldAlert, 
  ArrowRight, 
  Info, 
  KeyRound, 
  User, 
  Building, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { COLLEGE_INFO, FICTIONAL_STUDENTS } from '../data/fictionalData';

export default function RoleLoginPage({ setCurrentView, setSelectedPrn }) {
  const [activeRole, setActiveRole] = useState('student'); // 'student' | 'faculty' | 'admin'

  // Form states
  const [studentPrn, setStudentPrn] = useState('22UCO01042');
  const [studentMotherName, setStudentMotherName] = useState('SUNITA');
  const [facultyId, setFacultyId] = useState('FAC-CS-108');
  const [facultyDept, setFacultyDept] = useState('Computer Engineering');
  const [adminId, setAdminId] = useState('COE-ADMIN-01');

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    if (studentPrn.trim()) {
      setSelectedPrn(studentPrn.trim().toUpperCase());
    }
    setCurrentView('student');
  };

  const handleFacultySubmit = (e) => {
    e.preventDefault();
    setCurrentView('faculty');
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setCurrentView('admin');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Title & Guidance Header */}
      <div className="text-center mb-8 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Official Portal Access
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
          Sanjivani RMS Role Selection
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Choose your designated academic role to access your dashboard, examination records, or grading portal.
        </p>
      </div>

      {/* Transparent Stage 1 Notice */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 text-blue-700 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-semibold text-blue-950">
            Stage 1 UI Foundation Notice (No Fake Authentication)
          </p>
          <p className="text-blue-800 mt-0.5">
            Per development guidelines, fake authentication is not implemented. You can switch between roles or use the pre-filled sample values below to preview each portal dashboard directly.
          </p>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-xl grid grid-cols-3 gap-1 mb-8 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveRole('student')}
          className={`flex items-center justify-center gap-2 py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeRole === 'student'
              ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRole('faculty')}
          className={`flex items-center justify-center gap-2 py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeRole === 'faculty'
              ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Faculty</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRole('admin')}
          className={`flex items-center justify-center gap-2 py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeRole === 'admin'
              ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>COE / Admin</span>
        </button>
      </div>

      {/* Role-Specific Login Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        {/* STUDENT ROLE */}
        {activeRole === 'student' && (
          <form onSubmit={handleStudentSubmit} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Student Examination Access
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enter your PRN and Registered Mother's Name as per examination records.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Permanent Registration Number (PRN)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={studentPrn}
                    onChange={(e) => setStudentPrn(e.target.value)}
                    placeholder="e.g. 22UCO01042"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mother's Name (As per Admission Record)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={studentMotherName}
                    onChange={(e) => setStudentMotherName(e.target.value)}
                    placeholder="e.g. SUNITA"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Quick Sample Selector */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 font-medium">Quick Sample Records:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStudentPrn('22UCO01042');
                    setStudentMotherName('SUNITA');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-800 font-mono font-semibold rounded border border-slate-200 cursor-pointer"
                >
                  22UCO01042 (Computer)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentPrn('22UIT02015');
                    setStudentMotherName('ANITA');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-800 font-mono font-semibold rounded border border-slate-200 cursor-pointer"
                >
                  22UIT02015 (IT)
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedPrn(studentPrn);
                  setCurrentView('marksheet');
                }}
                className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
              >
                Direct Preview Statement of Grades →
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Enter Student Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* FACULTY ROLE */}
        {activeRole === 'faculty' && (
          <form onSubmit={handleFacultySubmit} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Faculty Evaluation Desk
                  </h2>
                  <p className="text-xs text-slate-500">
                    Course In-Charge & Internal Examiner Portal
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Faculty Employee ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    placeholder="FAC-CS-108"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={facultyDept}
                    onChange={(e) => setFacultyDept(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-100 text-xs text-indigo-900">
              <span className="font-semibold">Sample Instructor:</span> Prof. R. M. Kulkarni (CE501 - Database Management Systems & CE506 - DBMS Lab)
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Enter Faculty Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ADMIN / COE ROLE */}
        {activeRole === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Controller of Examinations (COE) Control Room
                  </h2>
                  <p className="text-xs text-slate-500">
                    Autonomous Section Administrative & Result Publication Terminal
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  COE Officer ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="COE-ADMIN-01"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Examination Authority Level
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    readOnly
                    value="Autonomous Examination Cell - Level 1"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-700">
              <span className="font-semibold">Authority Scope:</span> Result publication, grade moderation audit, transcript generation, ordinances verification.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Enter COE Administration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
