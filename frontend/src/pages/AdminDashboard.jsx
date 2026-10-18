import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Download, 
  FileText, 
  UserPlus,
  KeyRound,
  Inbox,
  Sparkles
} from 'lucide-react';
import { FICTIONAL_STUDENTS, ADMIN_STATS, COLLEGE_INFO } from '../data/fictionalData';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard({ setCurrentView, setSelectedPrn }) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmptyAudits, setShowEmptyAudits] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);

  // Provisioning form state
  const [newPrn, setNewPrn] = useState('');
  const [newName, setNewName] = useState('');
  const [newMotherName, setNewMotherName] = useState('');
  const [newSeatNo, setNewSeatNo] = useState('');
  const [newBranch, setNewBranch] = useState('Computer Engineering');
  const [newPassword, setNewPassword] = useState('Student@123');
  const [provisionLoading, setProvisionLoading] = useState(false);
  const [provisionResult, setProvisionResult] = useState(null);

  // Student records list (seeded + provisioned)
  const [studentList, setStudentList] = useState(FICTIONAL_STUDENTS);

  const filteredStudents = studentList.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.prn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProvisionStudent = async (e) => {
    e.preventDefault();
    setProvisionLoading(true);
    setProvisionResult(null);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${API_BASE}/admin/provision/student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prn: newPrn.trim().toUpperCase(),
          name: newName.trim(),
          motherName: newMotherName.trim().toUpperCase(),
          seatNo: newSeatNo.trim().toUpperCase(),
          branch: newBranch,
          password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setProvisionResult({
          type: 'error',
          message: data.message || 'Failed to provision student record.',
        });
      } else {
        setProvisionResult({
          type: 'success',
          message: `Candidate ${newName} (PRN: ${newPrn.toUpperCase()}) successfully provisioned and authorized in database!`,
        });

        // Add to local list for immediate display
        const newRecord = {
          prn: newPrn.trim().toUpperCase(),
          name: newName.trim(),
          motherName: newMotherName.trim().toUpperCase(),
          seatNo: newSeatNo.trim().toUpperCase(),
          branch: newBranch,
          semester: 'Semester V',
          sgpa: 8.50,
        };
        setStudentList([newRecord, ...studentList]);

        // Reset inputs
        setNewPrn('');
        setNewName('');
        setNewMotherName('');
        setNewSeatNo('');
      }
    } catch (err) {
      setProvisionResult({
        type: 'error',
        message: 'Could not reach server to provision account.',
      });
    } finally {
      setProvisionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin / COE Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0">
              <ShieldAlert className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-500 text-blue-950 px-2 py-0.5 rounded">
                  Examination Authority
                </span>
                <span className="text-xs text-blue-200">
                  {user ? `Logged in: ${user.name}` : 'COE Control Center'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                Controller of Examinations (COE)
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
                {COLLEGE_INFO.name} • Institutional Result Administration
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowProvisionModal(!showProvisionModal)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showProvisionModal ? 'Hide Provisioning Desk' : 'Provision Student Account'}</span>
            </button>

            <button
              onClick={() => setShowEmptyAudits(!showEmptyAudits)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {showEmptyAudits ? 'Show Active Results' : 'Preview Empty Grievance Queue'}
            </button>
          </div>
        </div>
      </div>

      {/* Authorized Provisioning Desk (Stage 2 Requirement) */}
      {showProvisionModal && (
        <div className="bg-white rounded-2xl border-2 border-blue-500 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-700" />
              <h3 className="text-base font-bold text-slate-900">
                Authorized Student Account Provisioning
              </h3>
            </div>
            <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              Admin Authorized Only
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Per security guidelines, student accounts cannot be self-registered. The Examination Cell provisions verified candidates with duplicate PRN validation and bcrypt password encryption.
          </p>

          {provisionResult && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                provisionResult.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-red-50 text-red-800 border border-red-300'
              }`}
            >
              {provisionResult.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{provisionResult.message}</span>
            </div>
          )}

          <form onSubmit={handleProvisionStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase">PRN (Unique)</label>
              <input
                type="text"
                required
                value={newPrn}
                onChange={(e) => setNewPrn(e.target.value)}
                placeholder="e.g. 24UCO01088"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase">Student Full Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. SNEHAL VIJAY JADHAV"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase">Mother's Name</label>
              <input
                type="text"
                required
                value={newMotherName}
                onChange={(e) => setNewMotherName(e.target.value)}
                placeholder="e.g. MEENA"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase">Seat Number</label>
              <input
                type="text"
                required
                value={newSeatNo}
                onChange={(e) => setNewSeatNo(e.target.value)}
                placeholder="SCOE24-C388"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase">Branch</label>
              <select
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase">Initial Password</label>
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={provisionLoading}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                {provisionLoading ? 'Authorizing in Database...' : 'Provision Candidate Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Total Enrolled Candidates
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-950">
            {ADMIN_STATS.totalStudents.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across B.Tech & M.Tech Programs
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Declared Results
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700">
            {ADMIN_STATS.resultsPublished.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Published Online
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Under Moderation
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600">
            {ADMIN_STATS.pendingEvaluation.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pending Board of Studies Audit
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Autonomous Pass Rate
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-800">
            {ADMIN_STATS.collegePassRate}
          </div>
          <p className="text-xs text-blue-600 font-medium mt-1">
            Winter 2024 Examination
          </p>
        </div>
      </div>

      {/* Main Administrative Views */}
      {showEmptyAudits ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <EmptyState
            title="Zero Unresolved Discrepancies or Grievances"
            description="The Examination Cell has zero pending student grievances or withheld marksheets for the active Winter 2024 session. All moderation logs are verified."
            badgeText="System Healthy"
            icon={Inbox}
            actionLabel="Return to Master Student Registry"
            onAction={() => setShowEmptyAudits(false)}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Master Candidate Registry & Grade Card Dispatch
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Search candidates by PRN, Name, or Branch to preview official Statements of Grades.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search PRN, student name, branch..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Student Registry Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PRN</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Mother's Name</th>
                  <th className="py-3 px-4">Branch / Specialization</th>
                  <th className="py-3 px-3 text-center">Semester</th>
                  <th className="py-3 px-3 text-center">SGPA</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Official Marksheet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.prn} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">
                        {student.prn}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {student.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {student.motherName || 'VERIFIED'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {student.branch}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">
                        {student.semester || 'Semester V'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-extrabold text-blue-950">
                        {student.sgpa ? student.sgpa.toFixed(2) : '8.50'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedPrn(student.prn);
                            setCurrentView('marksheet');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-md border border-blue-200 transition-colors cursor-pointer text-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No student records matched your query "{searchTerm}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
