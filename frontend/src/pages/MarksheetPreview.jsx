import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  CheckCircle, 
  Award, 
  FileText, 
  ShieldCheck, 
  Calendar, 
  User, 
  BookOpen, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import SanjivaniHeader from '../components/SanjivaniHeader';
import EmptyState from '../components/EmptyState';
import { 
  COLLEGE_INFO, 
  FICTIONAL_MARKSHEETS, 
  FICTIONAL_STUDENTS, 
  GRADING_SCALE 
} from '../data/fictionalData';

export default function MarksheetPreview({ setCurrentView, selectedPrn, setSelectedPrn }) {
  const [activePrn, setActivePrn] = useState(selectedPrn || '22UCO01042');
  const [showWithheldEmptyState, setShowWithheldEmptyState] = useState(false);

  const marksheet = FICTIONAL_MARKSHEETS[activePrn];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Action Toolbar (Hidden in Print) */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setCurrentView('student')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal</span>
          </button>

          {/* Student Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden md:inline">Select Candidate:</span>
            <select
              value={showWithheldEmptyState ? 'empty' : activePrn}
              onChange={(e) => {
                if (e.target.value === 'empty') {
                  setShowWithheldEmptyState(true);
                } else {
                  setShowWithheldEmptyState(false);
                  setActivePrn(e.target.value);
                  setSelectedPrn(e.target.value);
                }
              }}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
            >
              <option value="22UCO01042">Aarav Rajesh Shinde (PRN: 22UCO01042 - CE)</option>
              <option value="22UIT02015">Priya Sanjay Deshmukh (PRN: 22UIT02015 - IT)</option>
              <option value="empty">-- Preview Empty / Withheld Marksheet --</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Fictional Data Academic Watermark Notice (Screen Only) */}
      <div className="no-print p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Fictional Learning Data Notice:</strong> All PRNs, student records, and grades shown here are fictional demonstration values conforming to Sanjivani College of Engineering autonomous mark sheet format.
          </span>
        </div>
        <button
          onClick={() => setShowWithheldEmptyState(!showWithheldEmptyState)}
          className="underline text-amber-800 hover:text-amber-950 font-semibold cursor-pointer shrink-0 ml-2"
        >
          {showWithheldEmptyState ? 'Show Valid Card' : 'Test Empty State'}
        </button>
      </div>

      {/* Marksheet Container or Empty State */}
      {showWithheldEmptyState || !marksheet ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <EmptyState
            title="Statement of Grades Withheld / Unavailable"
            description="No published Statement of Grades was found for the requested registration number. Marksheets are generated following the conclusion of evaluation and moderation by the Examination Cell."
            badgeText="Status: Not Published"
            icon={FileText}
            actionLabel="Reset to Sample Student"
            onAction={() => {
              setShowWithheldEmptyState(false);
              setActivePrn('22UCO01042');
            }}
          />
        </div>
      ) : (
        /* OFFICIAL STATEMENT OF GRADES DOCUMENT CANVAS */
        <div className="marksheet-container bg-white text-slate-900 rounded-xl border-2 border-slate-800 p-6 sm:p-10 shadow-lg relative print:p-2 print:border-2 print:border-black print:shadow-none">
          {/* Institutional Header */}
          <SanjivaniHeader />

          {/* Student & Session Identification Block */}
          <div className="my-6 border border-slate-900 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-900">
              {/* Left Column: Student Credentials */}
              <div className="p-3 space-y-1.5">
                <div className="flex">
                  <span className="w-32 font-bold text-slate-700 uppercase">Student Name:</span>
                  <span className="font-extrabold text-blue-950 uppercase">{marksheet.studentName}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold text-slate-700 uppercase">Mother's Name:</span>
                  <span className="font-bold text-slate-900 uppercase">{marksheet.motherName}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold text-slate-700 uppercase">PRN:</span>
                  <span className="font-mono font-extrabold text-blue-950">{marksheet.prn}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold text-slate-700 uppercase">Seat No.:</span>
                  <span className="font-mono font-bold text-slate-900">{marksheet.seatNo}</span>
                </div>
              </div>

              {/* Right Column: Academic Details */}
              <div className="p-3 space-y-1.5">
                <div className="flex">
                  <span className="w-32 font-bold text-slate-700 uppercase">Program / Degree:</span>
                  <span className="font-bold text-slate-900">{marksheet.degree}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold text-slate-700 uppercase">Branch / Dept:</span>
                  <span className="font-bold text-blue-950">{marksheet.branch}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold text-slate-700 uppercase">Academic Year:</span>
                  <span className="font-bold text-slate-900">{marksheet.academicYear}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold text-slate-700 uppercase">Semester / Exam:</span>
                  <span className="font-bold text-slate-900">{marksheet.semester} ({marksheet.examination})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabular Course Performance (Reserves space for all required fields) */}
          <div className="overflow-x-auto border-2 border-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] border-b-2 border-slate-900">
                <tr className="divide-x divide-slate-900">
                  <th className="py-2.5 px-3 text-center w-24">Course Code</th>
                  <th className="py-2.5 px-3">Course Title / Subject Name</th>
                  <th className="py-2.5 px-2 text-center w-16">Course Type</th>
                  <th className="py-2.5 px-2 text-center w-16">Credits (CR)</th>
                  <th className="py-2.5 px-2 text-center w-16">Earned (EC)</th>
                  <th className="py-2.5 px-2 text-center w-14">Grade</th>
                  <th className="py-2.5 px-2 text-center w-16">Grade Points (GP)</th>
                  <th className="py-2.5 px-3 text-right w-20">Credit Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {marksheet.subjects.map((sub, idx) => (
                  <tr key={idx} className="divide-x divide-slate-300 hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-center text-slate-900">
                      {sub.courseCode}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900">
                      {sub.courseTitle}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-semibold">
                      {sub.courseType}
                    </td>
                    <td className="py-2 px-2 text-center font-semibold">
                      {sub.credits}
                    </td>
                    <td className="py-2 px-2 text-center font-semibold">
                      {sub.earnedCredits}
                    </td>
                    <td className="py-2 px-2 text-center font-extrabold">
                      {sub.grade}
                    </td>
                    <td className="py-2 px-2 text-center font-bold">
                      {sub.gradePoints}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-950 font-mono">
                      {sub.creditPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-900 font-extrabold bg-slate-100 text-slate-900">
                <tr className="divide-x divide-slate-900">
                  <td colSpan="3" className="py-2.5 px-3 uppercase text-right">
                    Total Credits & Points:
                  </td>
                  <td className="py-2.5 px-2 text-center">{marksheet.totalCR}</td>
                  <td className="py-2.5 px-2 text-center">{marksheet.totalEC}</td>
                  <td className="py-2.5 px-2 text-center">-</td>
                  <td className="py-2.5 px-2 text-center">-</td>
                  <td className="py-2.5 px-3 text-right font-mono">{marksheet.totalGP}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Semester Performance Calculation Summary Box */}
          <div className="mt-4 border-2 border-slate-900 p-4 bg-slate-50/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="border-r border-slate-300 pr-2">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Total Registered (CR)</span>
                <span className="text-base font-extrabold text-slate-900">{marksheet.totalCR}</span>
              </div>
              <div className="border-r border-slate-300 pr-2">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Total Earned (EC)</span>
                <span className="text-base font-extrabold text-slate-900">{marksheet.totalEC}</span>
              </div>
              <div className="border-r border-slate-300 pr-2">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Semester SGPA</span>
                <span className="text-xl font-black text-blue-950">{marksheet.sgpa.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Cumulative CGPA</span>
                <span className="text-xl font-black text-indigo-950">{marksheet.cgpa.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <div>
                <span className="font-bold text-slate-700 uppercase">Final Result: </span>
                <span className="font-black text-blue-900 uppercase bg-blue-100 px-2 py-0.5 rounded">
                  {marksheet.resultStatus}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-700 uppercase">Date of Declaration: </span>
                <span className="font-mono font-bold text-slate-900">{marksheet.resultDate}</span>
              </div>
            </div>
          </div>

          {/* Official Autonomous Grading System Legend */}
          <div className="mt-4 pt-3 border-t border-slate-300">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Autonomous Grading Scheme (10-Point Scale per UGC / SPPU Model)
            </h5>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-[10px] text-center border border-slate-300 bg-slate-50 p-1.5 rounded-xs">
              {GRADING_SCALE.map((g) => (
                <div key={g.grade} className="border border-slate-200 bg-white p-1 rounded-xs">
                  <div className="font-black text-blue-950">{g.grade}</div>
                  <div className="text-[9px] text-slate-500">{g.point} pts</div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-slate-500 mt-1">
              Course Types: TH = Theory, PR = Practical, OR = Oral / Viva, TW = Term Work, PE = Professional Elective, OE = Open Elective.
            </p>
          </div>

          {/* Official Verification Signatures Block */}
          <div className="mt-12 pt-8 border-t border-slate-900 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="h-10 flex items-end justify-center">
                <span className="font-serif italic text-slate-400 text-xs">Verified by Records</span>
              </div>
              <div className="border-t border-slate-700 pt-1 font-bold text-slate-800 uppercase text-[11px]">
                Prepared & Verified By
              </div>
            </div>

            <div>
              <div className="h-10 flex items-end justify-center">
                <span className="font-serif italic text-slate-400 text-xs">Approved by Academics</span>
              </div>
              <div className="border-t border-slate-700 pt-1 font-bold text-slate-800 uppercase text-[11px]">
                Dean (Academics)
              </div>
            </div>

            <div>
              <div className="h-10 flex items-end justify-center">
                <span className="font-serif italic text-blue-900 font-bold text-xs">[ Autonomous Cell Seal ]</span>
              </div>
              <div className="border-t border-slate-700 pt-1 font-extrabold text-blue-950 uppercase text-[11px]">
                Controller of Examinations
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
