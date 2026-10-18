import React, { useState } from 'react';
import { 
  GraduationCap, 
  FileText, 
  Award, 
  CheckCircle, 
  BookOpen, 
  Download, 
  ChevronRight, 
  Calendar,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { FICTIONAL_STUDENTS, FICTIONAL_MARKSHEETS } from '../data/fictionalData';
import EmptyState from '../components/EmptyState';

export default function StudentDashboard({ setCurrentView, selectedPrn, setSelectedPrn }) {
  const [selectedSemester, setSelectedSemester] = useState('Sem 5');

  // Find active student or fallback to default sample student
  const student = FICTIONAL_STUDENTS.find(s => s.prn === selectedPrn) || FICTIONAL_STUDENTS[0];
  const marksheet = FICTIONAL_MARKSHEETS[student.prn];

  const semesters = [
    { id: 'Sem 1', label: 'Semester I', sgpa: '8.45', credits: 20, status: 'Declared' },
    { id: 'Sem 2', label: 'Semester II', sgpa: '8.60', credits: 20, status: 'Declared' },
    { id: 'Sem 3', label: 'Semester III', sgpa: '8.55', credits: 22, status: 'Declared' },
    { id: 'Sem 4', label: 'Semester IV', sgpa: '8.80', credits: 22, status: 'Declared' },
    { id: 'Sem 5', label: 'Semester V (Current)', sgpa: student.sgpa.toFixed(2), credits: 21, status: 'Declared' },
    { id: 'Sem 6', label: 'Semester VI', sgpa: null, credits: 20, status: 'Upcoming' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Profile Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <GraduationCap className="w-9 h-9 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-400 text-blue-950 px-2 py-0.5 rounded font-mono">
                  PRN: {student.prn}
                </span>
                <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded">
                  Seat: {student.seatNo}
                </span>
                <span className="text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                  {student.status}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                {student.name}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                {student.degree} in {student.branch} • Sanjivani Autonomous
              </p>
              <p className="text-xs text-blue-200 mt-1">
                Mother's Name: <span className="font-semibold text-white">{student.motherName}</span> | Session: {student.academicYear}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <button
              onClick={() => {
                setSelectedPrn(student.prn);
                setCurrentView('marksheet');
              }}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>View Statement of Grades</span>
            </button>
            <span className="text-[11px] text-blue-200 text-center">
              Winter Session 2024 (Official Format)
            </span>
          </div>
        </div>
      </div>

      {/* Quick KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Current SGPA (Sem V)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-900">
              {student.sgpa}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ 10.0</span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> First Class Distinction
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Cumulative CGPA
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-900">
              {student.cgpa}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ 10.0</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across 5 Evaluated Semesters
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Earned Credits
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-800">
              {marksheet ? marksheet.totalEC : 21}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ {marksheet ? marksheet.totalCR : 21} CR</span>
          </div>
          <p className="text-xs text-blue-600 font-medium mt-1">
            100% Semester Completion
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Active Backlogs
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              0
            </span>
            <span className="text-xs text-slate-400 font-semibold">Courses</span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            All cleared in 1st attempt
          </p>
        </div>
      </div>

      {/* Semester History Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Academic Progression & Grade Summary
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a semester tab below to inspect published courses or view empty upcoming terms.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Switch Sample Student:</span>
            <select
              value={student.prn}
              onChange={(e) => setSelectedPrn(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
            >
              {FICTIONAL_STUDENTS.map((s) => (
                <option key={s.prn} value={s.prn}>
                  {s.name} ({s.branch.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Semester Buttons Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {semesters.map((sem) => {
            const isSelected = selectedSemester === sem.id;
            return (
              <button
                key={sem.id}
                onClick={() => setSelectedSemester(sem.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{sem.label}</span>
                {sem.status === 'Declared' ? (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-200 text-slate-700'
                  }`}>
                    SGPA: {sem.sgpa}
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-100 text-amber-800">
                    Pending
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content for Selected Semester */}
        {selectedSemester === 'Sem 5' && marksheet ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-800">
                Semester V Autonomous Examination Performance ({marksheet.academicYear})
              </span>
              <span>Result Declared: <strong>{marksheet.resultDate}</strong></span>
            </div>

            {/* Courses Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Course Code</th>
                    <th className="py-3 px-4">Course Title</th>
                    <th className="py-3 px-3 text-center">Type</th>
                    <th className="py-3 px-3 text-center">Credits (CR)</th>
                    <th className="py-3 px-3 text-center">Earned (EC)</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                    <th className="py-3 px-3 text-center">Grade Points (GP)</th>
                    <th className="py-3 px-3 text-right">Credit Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marksheet.subjects.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{sub.courseCode}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{sub.courseTitle}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                          {sub.courseType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">{sub.credits}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">{sub.earnedCredits}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-black ${
                          sub.grade === 'O' ? 'bg-purple-100 text-purple-900' :
                          sub.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-900' :
                          'bg-blue-100 text-blue-900'
                        }`}>
                          {sub.grade}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{sub.gradePoints}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{sub.creditPoints}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-xs text-slate-800 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan="3" className="py-3 px-4 text-slate-600 uppercase">
                      Semester Total
                    </td>
                    <td className="py-3 px-3 text-center">{marksheet.totalCR}</td>
                    <td className="py-3 px-3 text-center">{marksheet.totalEC}</td>
                    <td className="py-3 px-3 text-center">-</td>
                    <td className="py-3 px-3 text-center">-</td>
                    <td className="py-3 px-3 text-right text-blue-900 font-extrabold">{marksheet.totalGP}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : selectedSemester === 'Sem 6' ? (
          /* Clear Empty State for Upcoming Semester VI */
          <EmptyState
            title="Semester VI Results Not Declared"
            description="The academic session for Semester VI is currently in session. Official Statement of Grades will be published here by the Examination Cell following conclusion of the summer autonomous exams."
            badgeText="Academic Term In Progress"
            icon={Inbox}
            actionLabel="Return to Semester V"
            onAction={() => setSelectedSemester('Sem 5')}
          />
        ) : (
          /* Archive placeholder */
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
            <h4 className="text-sm font-bold text-slate-800">
              Archived Grade Card Available for {selectedSemester}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              This semester was successfully concluded and locked in the institutional repository.
            </p>
            <button
              onClick={() => setSelectedSemester('Sem 5')}
              className="mt-2 text-xs text-blue-700 font-bold hover:underline cursor-pointer"
            >
              Back to current active Semester V
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
