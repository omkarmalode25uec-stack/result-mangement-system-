import React, { useState } from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  ShieldAlert, 
  ArrowRight, 
  KeyRound, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle,
  Lock,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RoleLoginPage({ setCurrentView, setSelectedPrn }) {
  const [activeRole, setActiveRole] = useState('student'); // 'student' | 'faculty' | 'admin'
  const { login, authError, setAuthError, isAuthenticated, user } = useAuth();

  // Student Form
  const [studentPrn, setStudentPrn] = useState('22UCO01042');
  const [studentPassword, setStudentPassword] = useState('Student@123');
  const [showStudentPass, setShowStudentPass] = useState(false);

  // Faculty Form
  const [facultyIdentifier, setFacultyIdentifier] = useState('faculty.cs@sanjivani.edu.in');
  const [facultyPassword, setFacultyPassword] = useState('Faculty@123');
  const [showFacultyPass, setShowFacultyPass] = useState(false);

  // Admin Form
  const [adminIdentifier, setAdminIdentifier] = useState('admin@sanjivani.edu.in');
  const [adminPassword, setAdminPassword] = useState('Admin@123');
  const [showAdminPass, setShowAdminPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    const res = await login({
      prn: studentPrn.trim().toUpperCase(),
      password: studentPassword,
      role: 'Student',
    });

    setLoading(false);
    if (res.success) {
      setSuccessMsg(`Welcome, ${res.user.name}! Redirecting to student portal...`);
      setSelectedPrn(res.user.prn || studentPrn.trim().toUpperCase());
      setTimeout(() => {
        setCurrentView('student');
      }, 700);
    }
  };

  const handleFacultyLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    const res = await login({
      identifier: facultyIdentifier.trim(),
      password: facultyPassword,
      role: 'Faculty',
    });

    setLoading(false);
    if (res.success) {
      setSuccessMsg(`Welcome, ${res.user.name}! Redirecting to faculty portal...`);
      setTimeout(() => {
        setCurrentView('faculty');
      }, 700);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    const res = await login({
      identifier: adminIdentifier.trim(),
      password: adminPassword,
      role: 'Admin',
    });

    setLoading(false);
    if (res.success) {
      setSuccessMsg(`Welcome, ${res.user.name}! Redirecting to COE administration...`);
      setTimeout(() => {
        setCurrentView('admin');
      }, 700);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Title & Guidance Header */}
      <div className="text-center mb-8 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Secure Authentication • Stage 2
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
          Sanjivani RMS Portal Authentication
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Authenticate using your authorized institutional credentials. Sessions are securely governed by HTTP-only cookies and bcrypt-hashed records.
        </p>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {authError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl text-red-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{authError}</span>
          </div>
          <button
            onClick={() => setAuthError(null)}
            className="text-xs text-red-700 underline font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-xl grid grid-cols-3 gap-1 mb-8 shadow-inner">
        <button
          type="button"
          onClick={() => {
            setActiveRole('student');
            setAuthError(null);
          }}
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
          onClick={() => {
            setActiveRole('faculty');
            setAuthError(null);
          }}
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
          onClick={() => {
            setActiveRole('admin');
            setAuthError(null);
          }}
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
          <form onSubmit={handleStudentLogin} className="space-y-6">
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
                    Students log in using Permanent Registration Number (PRN) and account password.
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
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showStudentPass ? 'text' : 'password'}
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPass(!showStudentPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showStudentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Pre-configured Authorized Credentials Card */}
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-blue-950 mb-0.5">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  <span>Authorized Test Student Credentials (Database Seeded)</span>
                </div>
                <p className="text-slate-600">
                  PRN: <code className="font-bold text-blue-900 bg-white px-1.5 py-0.5 rounded border border-blue-200">22UCO01042</code> | Password: <code className="font-bold text-blue-900 bg-white px-1.5 py-0.5 rounded border border-blue-200">Student@123</code>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStudentPrn('22UCO01042');
                  setStudentPassword('Student@123');
                }}
                className="px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-900 font-bold rounded-lg border border-blue-300 transition-colors cursor-pointer shrink-0"
              >
                Auto-Fill Credentials
              </button>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                Self-registration is disabled for security. Accounts are provisioned by Examination Cell.
              </span>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In as Student'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* FACULTY ROLE */}
        {activeRole === 'faculty' && (
          <form onSubmit={handleFacultyLogin} className="space-y-6">
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
                    Faculty log in using official college email or Employee ID and password.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Email or Employee ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={facultyIdentifier}
                    onChange={(e) => setFacultyIdentifier(e.target.value)}
                    placeholder="faculty.cs@sanjivani.edu.in"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showFacultyPass ? 'text' : 'password'}
                    required
                    value={facultyPassword}
                    onChange={(e) => setFacultyPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFacultyPass(!showFacultyPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showFacultyPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Faculty Pre-configured Credentials */}
            <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-indigo-950 mb-0.5">
                  <Sparkles className="w-4 h-4 text-indigo-700" />
                  <span>Authorized Faculty Account (Database Seeded)</span>
                </div>
                <p className="text-slate-600">
                  Email: <code className="font-bold text-indigo-900 bg-white px-1.5 py-0.5 rounded border border-indigo-200">faculty.cs@sanjivani.edu.in</code> | Password: <code className="font-bold text-indigo-900 bg-white px-1.5 py-0.5 rounded border border-indigo-200">Faculty@123</code>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFacultyIdentifier('faculty.cs@sanjivani.edu.in');
                  setFacultyPassword('Faculty@123');
                }}
                className="px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-900 font-bold rounded-lg border border-indigo-300 transition-colors cursor-pointer shrink-0"
              >
                Auto-Fill Credentials
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-900 hover:bg-indigo-800 disabled:bg-indigo-400 text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In as Faculty'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ADMIN ROLE */}
        {activeRole === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-6">
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
                    Administrator access to result publication and authorized account provisioning.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Email or Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    placeholder="admin@sanjivani.edu.in"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Admin Pre-configured Credentials */}
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-950 mb-0.5">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <span>Authorized COE Admin Account (Database Seeded)</span>
                </div>
                <p className="text-slate-600">
                  Email: <code className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300">admin@sanjivani.edu.in</code> | Password: <code className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300">Admin@123</code>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAdminIdentifier('admin@sanjivani.edu.in');
                  setAdminPassword('Admin@123');
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer shrink-0"
              >
                Auto-Fill Credentials
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-black disabled:bg-slate-500 text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In as COE Admin'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
