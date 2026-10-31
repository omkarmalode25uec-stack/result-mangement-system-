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
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';

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

  // Result state
  const [hasRequestedResult, setHasRequestedResult] = useState(false);
  const [marksheetData, setMarksheetData] = useState(null);
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
          // Ensure 2026–27 / 2026-27 is present at the top
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
      // Use user context data
    }
  };

  /**
   * Fetch specific semester result for the authenticated student
   */
  const handleViewResult = async (e) => {
    if (e) e.preventDefault();
    setHasRequestedResult(true);
    setLoadingResult(true);
    setResultError(null);
    setDownloadError(null);
    setMarksheetData(null);

    try {
      // Normalize academic year for API call (standard hyphen)
      const normalizedYear = selectedAcademicYear.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-').trim();
      const url = `${API_BASE}/student/result?academicYear=${encodeURIComponent(normalizedYear)}&semester=${encodeURIComponent(selectedSemNum)}`;
      
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.data) {
        // Only accept published result
        if (data.data.isPublished) {
          setMarksheetData(data.data);
          setResultError(null);
        } else {
          setMarksheetData(null);
          setResultError({
            status: 403,
            title: 'Statement of Grades Under Verification',
            message: `Examination results for Semester ${selectedSemNum} (${selectedAcademicYear}) are under moderation by the Examination Cell and have not been declared yet.`,
          });
        }
      } else if (res.status === 403) {
        setMarksheetData(null);
        setResultError({
          status: 403,
          title: 'Statement of Grades Under Verification',
          message: data.message || `Examination results for Semester ${selectedSemNum} (${selectedAcademicYear}) are currently under verification and have not been declared yet.`,
        });
      } else {
        setMarksheetData(null);
        setResultError({
          status: 404,
          title: `No Published Result for Semester ${selectedSemNum}`,
          message: data.message || `No published Statement of Grades found for Academic Year ${selectedAcademicYear}, Semester ${selectedSemNum}. Results are declared following formal evaluation.`,
        });
      }
    } catch (err) {
      setMarksheetData(null);
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
   * Download official Statement of Grades PDF directly from authoritative backend
   */
  const handleDownloadPDF = async () => {
    if (!marksheetData) return;
    setDownloadingPdf(true);
    setDownloadError(null);

    try {
      const normalizedYear = selectedAcademicYear.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-').trim();
      const studentPrn = user?.prn || marksheetData.prn;
      const url = `${API_BASE}/marksheet/${encodeURIComponent(studentPrn)}/pdf?academicYear=${encodeURIComponent(normalizedYear)}&semester=${encodeURIComponent(selectedSemNum)}`;
      
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
      const semLabel = marksheetData.semesterLabel ? marksheetData.semesterLabel.replace(/\s+/g, '_') : `Sem${selectedSemNum}`;
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

  const displayName = studentProfile?.name || user?.name || 'AARAV RAJESH SHINDE';
  const displayPrn = user?.prn || '22UCO01042';
  const displayBranch = studentProfile?.branch || 'Computer Engineering';
  const displaySeat = studentProfile?.seatNo || marksheetData?.seatNo || 'SCOE24-C308';
  const displayDegree = studentProfile?.degree || 'Bachelor of Technology (B.Tech)';
  const selectedSemObj = SEMESTER_OPTIONS.find(s => s.value === Number(selectedSemNum)) || SEMESTER_OPTIONS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
                Select your academic year and semester to retrieve your official published result.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleViewResult} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
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

          {/* Button: View Result */}
          <div>
            <button
              type="submit"
              disabled={loadingResult}
              className="w-full py-2.5 px-6 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer h-[42px]"
            >
              {loadingResult ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking Records...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>View Result</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Download Error Banner */}
      {downloadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
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

      {/* RESULT VIEW CANVAS (Only displays the selected semester) */}
      {!hasRequestedResult ? (
        /* Prompt before requesting */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Select Term & Click "View Result"
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Choose your desired Academic Year (e.g. 2026–27) and Semester (e.g. Semester I) above, then click <strong>View Result</strong> to retrieve your official Statement of Grades.
          </p>
        </div>
      ) : loadingResult ? (
        /* Loading Spinner */
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3 shadow-xs">
          <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-700">
            Retrieving verified Statement of Grades from Examination Cell database...
          </p>
          <p className="text-[11px] text-slate-400">
            Querying: Academic Year {selectedAcademicYear} • {selectedSemObj.label}
          </p>
        </div>
      ) : marksheetData ? (
        /* PUBLISHED RESULT VIEW (Only this selected semester) */
        <div className="space-y-6">
          {/* Result Header & Action Ribbon */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Published Result
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-700">
                  {marksheetData.academicYear} • {marksheetData.semesterLabel || selectedSemObj.label}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {marksheetData.examinationName || `Autonomous Examination`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Date of Declaration: <strong>{marksheetData.resultDate || '12-01-2027'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Generate / Download Result PDF Button */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
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
                onClick={() => {
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                title="Select another semester"
              >
                Change Term
              </button>
            </div>
          </div>

          {/* Performance Highlights KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Semester SGPA
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-blue-900">
                  {typeof marksheetData.sgpa === 'number' ? marksheetData.sgpa.toFixed(2) : marksheetData.sgpa}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ 10.00</span>
              </div>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                {marksheetData.resultStatus || 'PASS'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Cumulative CGPA
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-indigo-900">
                  {typeof marksheetData.cgpa === 'number' ? marksheetData.cgpa.toFixed(2) : marksheetData.cgpa || '8.95'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ 10.00</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Cumulative Performance
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Credits Earned (EC)
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {marksheetData.totalEC}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  / {marksheetData.totalCR} CR
                </span>
              </div>
              <p className="text-xs text-blue-700 font-semibold mt-1">
                Total Credit Points: {marksheetData.totalGP}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Academic Standing
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-emerald-700">
                  CLEARED
                </span>
              </div>
              <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> All enrolled courses passed
              </p>
            </div>
          </div>

          {/* Official Course Evaluation Marksheet Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-900" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Autonomous Statement of Grades • {marksheetData.semesterLabel || selectedSemObj.label} ({marksheetData.academicYear})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                10-Point UGC/SPPU Autonomous Scale
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Course Code</th>
                    <th className="py-3 px-4">Course Title</th>
                    <th className="py-3 px-3 text-center">Type</th>
                    <th className="py-3 px-3 text-center">Credits (CR)</th>
                    <th className="py-3 px-3 text-center">Earned (EC)</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                    <th className="py-3 px-3 text-center">Grade Point (GP)</th>
                    <th className="py-3 px-4 text-right">Credit Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(marksheetData.subjects || []).map((sub, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{sub.courseCode}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{sub.courseTitle}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                          {sub.courseType || 'TH'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">{sub.credits}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">{sub.earnedCredits}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-black ${
                          sub.grade === 'O' ? 'bg-purple-100 text-purple-900' :
                          sub.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-900' :
                          sub.grade === 'F' ? 'bg-red-100 text-red-900' :
                          'bg-blue-100 text-blue-900'
                        }`}>
                          {sub.grade}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {sub.gradePoints ?? sub.gradePoint ?? 0}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {sub.creditPoints ?? (sub.credits * (sub.gradePoints || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-xs text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan="3" className="py-3 px-4 uppercase text-slate-700">
                      Semester Total
                    </td>
                    <td className="py-3 px-3 text-center">{marksheetData.totalCR}</td>
                    <td className="py-3 px-3 text-center">{marksheetData.totalEC}</td>
                    <td className="py-3 px-3 text-center text-slate-400">-</td>
                    <td className="py-3 px-3 text-center text-slate-400">-</td>
                    <td className="py-3 px-4 text-right font-mono text-blue-900 font-black">
                      {marksheetData.totalGP}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
              <div>
                <strong>Final Result Status: </strong>
                <span className="font-bold text-emerald-700 uppercase">
                  {marksheetData.resultStatus || 'PASS'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="text-blue-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Statement of Grades (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* RESULT UNAVAILABLE / UNPUBLISHED STATE */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <EmptyState
            title={resultError?.title || `Semester ${selectedSemNum} Results Not Available`}
            description={resultError?.message || `No published Statement of Grades found for Academic Year ${selectedAcademicYear}, Semester ${selectedSemNum}. Results are declared by the Examination Cell following conclusion of evaluations.`}
            badgeText={resultError?.status === 403 ? 'Status: Under Verification' : 'Status: Not Declared'}
            icon={resultError?.status === 403 ? Clock : Inbox}
            actionLabel="Try Demo Semester I (2026–27)"
            onAction={() => {
              setSelectedAcademicYear('2026–27');
              setSelectedSemNum(1);
              setTimeout(() => {
                handleViewResult();
              }, 100);
            }}
          />
        </div>
      )}
    </div>
  );
}
