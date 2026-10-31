import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  FileText, 
  Award, 
  CheckCircle, 
  BookOpen, 
  Download, 
  Calendar,
  AlertCircle,
  Inbox,
  Clock,
  Printer,
  RefreshCw,
  ShieldCheck,
  Search,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import SanjivaniHeader from '../components/SanjivaniHeader';
import { GRADING_SCALE, COLLEGE_INFO } from '../data/fictionalData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SEMESTER_OPTIONS = [
  { value: 1, label: 'Semester I' },
  { value: 2, label: 'Semester II' },
  { value: 3, label: 'Semester III' },
  { value: 4, label: 'Semester IV' },
  { value: 5, label: 'Semester V' },
  { value: 6, label: 'Semester VI' },
  { value: 7, label: 'Semester VII' },
  { value: 8, label: 'Semester VIII' },
];

const DEFAULT_ACADEMIC_YEARS = [
  '2026–27',
  '2025–26',
  '2024–25',
  '2023–24',
];

export default function StudentDashboard() {
  const { user } = useAuth();

  // Selected academic year and semester for result lookup
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026–27');
  const [selectedSemNum, setSelectedSemNum] = useState(1);
  const [academicYears, setAcademicYears] = useState(DEFAULT_ACADEMIC_YEARS);

  // Result and view state
  const [hasRequestedResult, setHasRequestedResult] = useState(false);
  const [marksheetData, setMarksheetData] = useState(null);
  const [showMarksheetView, setShowMarksheetView] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [resultError, setResultError] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  // Student profile state
  const [studentProfile, setStudentProfile] = useState(null);

  // Load available sessions from database and student profile on mount
  useEffect(() => {
    loadSessions();
    loadStudentProfile();
  }, [user]);

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const uniqueYears = Array.from(new Set(data.data.map(s => s.academicYear)));
          const formatted = uniqueYears.map(y => y.replace('-', '–'));
          if (!formatted.includes('2026–27') && !formatted.includes('2026-27')) {
            formatted.unshift('2026–27');
          }
          setAcademicYears(formatted);
        }
      }
    } catch {
      // Retain default years
    }
  };

  const loadStudentProfile = async () => {
    if (!user?.prn) return;
    try {
      const res = await fetch(`${API_BASE}/students/${encodeURIComponent(user.prn)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setStudentProfile(data.data);
        }
      }
    } catch {
      // Retain defaults
    }
  };

  /**
   * Fetch specific semester result and transition to official Statement of Grades marksheet
   */
  const handleGenerateResult = async (e) => {
    if (e) e.preventDefault();
    setHasRequestedResult(true);
    setLoadingResult(true);
    setResultError(null);
    setDownloadError(null);

    try {
      // Normalize academic year for API call (standard hyphen)
      const normalizedYear = selectedAcademicYear.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-').trim();
      const url = `${API_BASE}/student/result?academicYear=${encodeURIComponent(normalizedYear)}&semester=${encodeURIComponent(selectedSemNum)}`;
      
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.data) {
        // Enforce publication check: Only show published result
        if (data.data.isPublished) {
          setMarksheetData(data.data);
          setShowMarksheetView(true);
          setResultError(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setMarksheetData(null);
          setShowMarksheetView(false);
          setResultError({
            status: 403,
            title: 'Statement of Grades Under Verification',
            message: `Examination results for Semester ${selectedSemNum} (${selectedAcademicYear}) are under moderation by the Examination Cell and have not been declared yet.`,
          });
        }
      } else if (res.status === 403) {
        setMarksheetData(null);
        setShowMarksheetView(false);
        setResultError({
          status: 403,
          title: 'Statement of Grades Under Verification',
          message: data.message || `Examination results for Semester ${selectedSemNum} (${selectedAcademicYear}) are currently under verification and have not been declared yet.`,
        });
      } else {
        setMarksheetData(null);
        setShowMarksheetView(false);
        setResultError({
          status: 404,
          title: `No Published Result for Semester ${selectedSemNum}`,
          message: data.message || `No published Statement of Grades found for Academic Year ${selectedAcademicYear}, Semester ${selectedSemNum}. Results are declared following formal evaluation.`,
        });
      }
    } catch (err) {
      setMarksheetData(null);
      setShowMarksheetView(false);
      setResultError({
        status: 500,
        title: 'Connection Error',
        message: 'Could not connect to the academic result service. Please verify that the RMS server is active.',
      });
    } finally {
      setLoadingResult(false);
    }
  };

  /**
   * Return to dashboard selector
   */
  const handleBackToDashboard = () => {
    setShowMarksheetView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Download official Statement of Grades PDF directly from backend
   */
  const handleDownloadPDF = async () => {
    if (!marksheetData) return;
    setDownloadingPdf(true);
    setDownloadError(null);

    try {
      const normalizedYear = (marksheetData.academicYear || selectedAcademicYear).replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-').trim();
      const studentPrn = user?.prn || marksheetData.prn;
      const semNum = marksheetData.semester || selectedSemNum;
      const url = `${API_BASE}/marksheet/${encodeURIComponent(studentPrn)}/pdf?academicYear=${encodeURIComponent(normalizedYear)}&semester=${encodeURIComponent(semNum)}`;
      
      const res = await fetch(url, { credentials: 'include' });

      if (!res.ok) {
        let errMsg = 'Failed to generate Statement of Grades PDF.';
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const semLabel = marksheetData.semesterLabel ? marksheetData.semesterLabel.replace(/\s+/g, '_') : `Sem${semNum}`;
      a.download = `Statement_of_Grades_${studentPrn}_${semLabel}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('[StudentDashboard] PDF Download Error:', err);
      setDownloadError(err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  /**
   * Print on-screen marksheet
   */
  const handlePrint = () => {
    window.print();
  };

  const displayName = marksheetData?.studentName || studentProfile?.name || user?.name || 'AARAV RAJESH SHINDE';
  const displayPrn = marksheetData?.prn || user?.prn || '22UCO01042';
  const displayBranch = marksheetData?.branch || studentProfile?.branch || 'Computer Engineering';
  const displaySeat = marksheetData?.seatNo || studentProfile?.seatNo || 'SCOE24-C308';
  const displayDegree = marksheetData?.degree || studentProfile?.degree || 'Bachelor of Technology (B.Tech)';
  const displayMotherName = marksheetData?.motherName || studentProfile?.motherName || 'SUNITA';
  const selectedSemObj = SEMESTER_OPTIONS.find(s => s.value === Number(selectedSemNum)) || SEMESTER_OPTIONS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* =========================================================================
          VIEW MODE 1: DEDICATED STATEMENT OF GRADES MARKSHEET VIEW
          ========================================================================= */}
      {showMarksheetView && marksheetData ? (
        <div className="space-y-6">
          {/* Top Action Toolbar (Outside the marksheet, hidden in print) */}
          <div className="no-print bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleBackToDashboard}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>

              <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Official Result: Academic Year {marksheetData.academicYear} • {marksheetData.semesterLabel || selectedSemObj.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Download official PDF generated by Examination Cell"
              >
                {downloadingPdf ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Result PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Marksheet</span>
              </button>
            </div>
          </div>

          {/* Download Error Banner */}
          {downloadError && (
            <div className="no-print p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span><strong>PDF Generation Notice:</strong> {downloadError}</span>
              </div>
              <button
                type="button"
                onClick={() => setDownloadError(null)}
                className="text-red-700 font-bold hover:underline cursor-pointer ml-4"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* =====================================================================
              OFFICIAL SANJIVANI COLLEGE OF ENGINEERING STATEMENT OF GRADES CANVAS
              ===================================================================== */}
          <div className="marksheet-document bg-white text-slate-900 rounded-xl border-2 border-slate-900 p-6 sm:p-10 shadow-xl max-w-5xl mx-auto print:border-none print:shadow-none print:p-0">
            
            {/* 1. Header with Sanjivani Branding and Title */}
            <SanjivaniHeader 
              examinationSession={marksheetData.examinationName || `Winter Session 2026 Autonomous Examination`} 
            />

            {/* 2. Structured Student & Academic Identification Box */}
            <div className="my-5 border-2 border-slate-900 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-900">
                {/* Left Column: Candidate Information */}
                <div className="p-3.5 space-y-2">
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700 uppercase">Student Name:</span>
                    <span className="font-extrabold text-blue-950 uppercase">{displayName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700 uppercase">Mother's Name:</span>
                    <span className="font-bold text-slate-900 uppercase">{displayMotherName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700 uppercase">PRN:</span>
                    <span className="font-mono font-extrabold text-blue-950">{displayPrn}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700 uppercase">Seat No.:</span>
                    <span className="font-mono font-bold text-slate-900">{displaySeat}</span>
                  </div>
                </div>

                {/* Right Column: Academic & Session Details */}
                <div className="p-3.5 space-y-2">
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700 uppercase">Programme / Degree:</span>
                    <span className="font-bold text-slate-900">{displayDegree}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700 uppercase">Branch / Dept:</span>
                    <span className="font-bold text-blue-950">{displayBranch}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700 uppercase">Academic Year:</span>
                    <span className="font-bold text-slate-900">{marksheetData.academicYear}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700 uppercase">Semester / Pattern:</span>
                    <span className="font-bold text-slate-900">
                      {marksheetData.semesterLabel || selectedSemObj.label} • {marksheetData.gradingSchemeVersion || '2022 Autonomous Pattern'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Subject Grades Table (Strict Academic Format) */}
            <div className="overflow-x-auto border-2 border-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] border-b-2 border-slate-900">
                  <tr className="divide-x divide-slate-900">
                    <th className="py-2.5 px-2 text-center w-14">Sr. No.</th>
                    <th className="py-2.5 px-3 text-center w-24">Course Code</th>
                    <th className="py-2.5 px-3">Course Title / Subject Name</th>
                    <th className="py-2.5 px-2 text-center w-16">Course Type</th>
                    <th className="py-2.5 px-2 text-center w-16">Credits (CR)</th>
                    <th className="py-2.5 px-2 text-center w-16">Earned (EC)</th>
                    <th className="py-2.5 px-2 text-center w-14">Grade</th>
                    <th className="py-2.5 px-2 text-center w-18">Grade Points (GP)</th>
                    <th className="py-2.5 px-3 text-right w-20">Credit Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {(marksheetData.subjects || []).map((sub, idx) => (
                    <tr key={idx} className="divide-x divide-slate-300 hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-2 text-center text-slate-600 font-semibold">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-center text-blue-950">
                        {sub.courseCode}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {sub.courseTitle}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-semibold text-slate-700">
                        {sub.courseType || 'TH'}
                      </td>
                      <td className="py-2 px-2 text-center font-semibold text-slate-800">
                        {sub.credits}
                      </td>
                      <td className="py-2 px-2 text-center font-semibold text-slate-800">
                        {sub.earnedCredits}
                      </td>
                      <td className="py-2 px-2 text-center font-extrabold">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                          sub.grade === 'O' ? 'bg-purple-100 text-purple-900 font-black' :
                          sub.grade?.startsWith('A') ? 'bg-emerald-100 text-emerald-900 font-black' :
                          sub.grade === 'F' ? 'bg-red-100 text-red-900 font-black' :
                          'bg-blue-100 text-blue-900 font-bold'
                        }`}>
                          {sub.grade}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-800">
                        {sub.gradePoints ?? sub.gradePoint ?? 0}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-950 font-mono">
                        {sub.creditPoints ?? (sub.credits * (sub.gradePoints || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-900 font-extrabold bg-slate-100 text-slate-900">
                  <tr className="divide-x divide-slate-900">
                    <td colSpan="4" className="py-2.5 px-3 uppercase text-right">
                      Total Credits & Credit Points:
                    </td>
                    <td className="py-2.5 px-2 text-center">{marksheetData.totalCR}</td>
                    <td className="py-2.5 px-2 text-center">{marksheetData.totalEC}</td>
                    <td className="py-2.5 px-2 text-center">-</td>
                    <td className="py-2.5 px-2 text-center">-</td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-950 font-black">
                      {marksheetData.totalGP}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 4. Semester Performance Summary Box */}
            <div className="mt-5 border-2 border-slate-900 p-4 bg-slate-50/60">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="border-r border-slate-300 pr-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">Total Registered (CR)</span>
                  <span className="text-lg font-extrabold text-slate-900">{marksheetData.totalCR}</span>
                </div>
                <div className="border-r border-slate-300 pr-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">Total Earned (EC)</span>
                  <span className="text-lg font-extrabold text-slate-900">{marksheetData.totalEC}</span>
                </div>
                <div className="border-r border-slate-300 pr-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">Total Credit Points (GP)</span>
                  <span className="text-lg font-extrabold text-slate-900">{marksheetData.totalGP}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">Semester SGPA</span>
                  <span className="text-2xl font-black text-blue-950">
                    {typeof marksheetData.sgpa === 'number' ? marksheetData.sgpa.toFixed(2) : marksheetData.sgpa}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold block">Scale: 10.00</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div>
                  <span className="font-bold text-slate-700 uppercase">Final Result Status: </span>
                  <span className="font-black text-emerald-900 uppercase bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">
                    {marksheetData.resultStatus || 'PASS - FIRST CLASS WITH DISTINCTION'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-bold text-slate-700 uppercase">Cumulative CGPA: </span>
                    <span className="font-extrabold text-indigo-950">
                      {typeof marksheetData.cgpa === 'number' ? marksheetData.cgpa.toFixed(2) : marksheetData.cgpa || '8.95'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 uppercase">Date of Declaration: </span>
                    <span className="font-mono font-bold text-slate-900">
                      {marksheetData.resultDate || '12-01-2027'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Official Autonomous Grading Scheme Legend */}
            <div className="mt-4 pt-3 border-t border-slate-300">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Autonomous Grading Scheme (10-Point Scale per UGC / SPPU Model)
              </h5>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-[10px] text-center border border-slate-300 bg-slate-50 p-1.5 rounded-xs">
                {GRADING_SCALE.map((g) => (
                  <div key={g.grade} className="border border-slate-200 bg-white p-1 rounded-xs">
                    <div className="font-black text-blue-950">{g.grade}</div>
                    <div className="text-[9px] text-slate-600">{g.point} pts</div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-500 mt-1">
                Abbreviations: TH = Theory, PR = Practical, TW = Term Work, OR = Oral / Viva, CR = Credits Registered, EC = Earned Credits, GP = Grade Points, CP = Credit Points, SGPA = Semester Grade Point Average.
              </p>
            </div>

            {/* 6. Institutional Sign-Off & Verification Footer */}
            <div className="mt-12 pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-center text-xs">
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
                  <div className="border border-dashed border-slate-400 px-2 py-0.5 rounded text-[10px] text-blue-950 font-bold bg-blue-50/50">
                    [ Autonomous Cell Seal ]
                  </div>
                </div>
                <div className="border-t border-slate-700 pt-1 font-extrabold text-blue-950 uppercase text-[11px]">
                  Controller of Examinations
                </div>
              </div>
            </div>

            {/* 7. Bottom Academic Disclaimer */}
            <div className="mt-8 pt-2 border-t border-slate-200 text-center">
              <p className="text-[8px] text-slate-500 uppercase tracking-tight">
                DISCLAIMER: This official Statement of Grades is electronically generated by Sanjivani College of Engineering Examination Management Portal. Any unauthorized alteration or tampering constitutes an offense under Maharashtra Public Universities Act.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
           VIEW MODE 2: DASHBOARD VIEW (PROFILE & RESULT GENERATION CONTROLS)
           ========================================================================= */
        <div className="space-y-8">
          {/* Student Profile Header Banner */}
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-blue-800/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 transform skew-x-12 pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                  <GraduationCap className="w-9 h-9 text-amber-300" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider bg-amber-400 text-blue-950 px-2.5 py-0.5 rounded font-mono shadow-xs">
                      PRN: {displayPrn}
                    </span>
                    <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded backdrop-blur-xs font-mono">
                      Seat: {displaySeat}
                    </span>
                    <span className="text-xs font-medium text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Verified Candidate
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                    {displayName}
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100 mt-0.5 flex flex-wrap items-center gap-x-2">
                    <span>{displayDegree}</span>
                    <span>•</span>
                    <span className="font-semibold text-amber-200">{displayBranch}</span>
                    <span>•</span>
                    <span>Sanjivani Autonomous Institute under SPPU</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RESULT SELECTION WORKFLOW: Step 3, 4, 5 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Statement of Grades Lookup
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select your academic year and semester to generate and view your official college Statement of Grades marksheet.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleGenerateResult} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              {/* Dropdown 1: Academic Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Academic Year
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => {
                      setSelectedAcademicYear(e.target.value);
                      setHasRequestedResult(false);
                      setMarksheetData(null);
                      setResultError(null);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    {academicYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dropdown 2: Semester */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Semester
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <select
                    value={selectedSemNum}
                    onChange={(e) => {
                      setSelectedSemNum(Number(e.target.value));
                      setHasRequestedResult(false);
                      setMarksheetData(null);
                      setResultError(null);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    {SEMESTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Button: Generate Result */}
              <div>
                <button
                  type="submit"
                  disabled={loadingResult}
                  className="w-full py-2.5 px-6 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer h-[42px]"
                >
                  {loadingResult ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Marksheet...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Generate Result</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Feedback & Result Status State */}
          {loadingResult ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3 shadow-xs">
              <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                Retrieving verified Statement of Grades from Examination Cell database...
              </p>
              <p className="text-[11px] text-slate-400">
                Querying: Academic Year {selectedAcademicYear} • {selectedSemObj.label}
              </p>
            </div>
          ) : resultError ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
              <EmptyState
                title={resultError?.title || `Semester ${selectedSemNum} Results Not Available`}
                description={resultError?.message || `No published Statement of Grades found for Academic Year ${selectedAcademicYear}, Semester ${selectedSemNum}. Results are declared by the Examination Cell following conclusion of evaluations.`}
                badgeText={resultError?.status === 403 ? 'Status: Under Verification' : 'Status: Not Declared'}
                icon={resultError?.status === 403 ? Clock : Inbox}
                actionLabel="Select Demo Semester I (2026–27)"
                onAction={() => {
                  setSelectedAcademicYear('2026–27');
                  setSelectedSemNum(1);
                  setTimeout(() => {
                    handleGenerateResult();
                  }, 100);
                }}
              />
            </div>
          ) : (
            /* Prompt before requesting */
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Select Academic Session & Click "Generate Result"
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Choose your desired Academic Year (e.g. 2026–27) and Semester (e.g. Semester I) above, then click <strong>Generate Result</strong> to display your official college Statement of Grades marksheet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
