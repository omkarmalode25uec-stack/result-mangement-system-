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
  Layers,
  Inbox
} from 'lucide-react';
import { FICTIONAL_STUDENTS, ADMIN_STATS, COLLEGE_INFO } from '../data/fictionalData';
import EmptyState from '../components/EmptyState';

export default function AdminDashboard({ setCurrentView, setSelectedPrn }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmptyAudits, setShowEmptyAudits] = useState(false);

  const filteredStudents = FICTIONAL_STUDENTS.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.prn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <span className="text-xs text-blue-200">Autonomous Cell • SPPU</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                Controller of Examinations (COE)
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
                {COLLEGE_INFO.name} • Institutional Result Administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmptyAudits(!showEmptyAudits)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {showEmptyAudits ? 'Show Active Results' : 'Preview Empty Discrepancy Queue'}
            </button>
          </div>
        </div>
      </div>

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
                        {student.motherName}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {student.branch}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">
                        {student.semester}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-extrabold text-blue-950">
                        {student.sgpa.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Declared
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
