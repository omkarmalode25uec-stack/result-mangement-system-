import React, { useState, useEffect } from 'react';
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
  Inbox,
  Clock,
  Printer,
  RefreshCw,
  ShieldCheck,
  Building,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FICTIONAL_STUDENTS, FICTIONAL_MARKSHEETS } from '../data/fictionalData';
import EmptyState from '../components/EmptyState';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function StudentDashboard({ setCurrentView, selectedPrn, setSelectedPrn }) {
  const { user } = useAuth();

  // Determine active PRN: prioritize authenticated student's PRN, else selectedPrn
  const effectivePrn = (user && user.role === 'Student' && user.prn)
    ? user.prn
    : (selectedPrn || '22UCO01042');

  const [activePrn, setActivePrn] = useState(effectivePrn);
  const [selectedSemNum, setSelectedSemNum] = useState(5);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2024-2025');

  // State from backend
  const [studentProfile, setStudentProfile] = useState(null);
  const [terms, setTerms] = useState([]);
  const [marksheetData, setMarksheetData] = useState(null);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [loadingResult, setLoadingResult] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [resultError, setResultError] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  // Sync activePrn when user or selectedPrn changes
  useEffect(() => {
    if (user && user.role === 'Student' && user.prn) {
      setActivePrn(user.prn);
    } else if (selectedPrn) {
      setActivePrn(selectedPrn);
    }
  }, [user, selectedPrn]);

  // Load student academic terms progression on activePrn change
  useEffect(() => {
    fetchStudentTerms();
  }, [activePrn]);

  // Load marksheet for selected semester
  useEffect(() => {
    if (activePrn && selectedSemNum) {
      fetchSemesterResult(selectedSemNum, selectedAcademicYear);
    }
  }, [activePrn, selectedSemNum, selectedAcademicYear]);

  /**
   * Fetch all academic terms for candidate from backend API
   */
  const fetchStudentTerms = async () => {
    setLoadingTerms(true);
    setResultError(null);
    try {
      const res = await fetch(`${API_BASE}/student/terms?prn=${encodeURIComponent(activePrn)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTerms(data.terms || []);
          if (data.student) {
            setStudentProfile(data.student);
            if (data.student.currentSemester) {
              setSelectedSemNum(data.student.currentSemester);
            }
            if (data.student.academicYear) {
              setSelectedAcademicYear(data.student.academicYear);
            }
          }
        }
      } else {
        // Fallback for offline / demo mode
        useOfflineTermsFallback();
      }
    } catch (err) {
      console.warn('[StudentDashboard] Backend unreachable, using offline data:', err.message);
      useOfflineTermsFallback();
    } finally {
      setLoadingTerms(false);
    }
  };

  const useOfflineTermsFallback = () => {
    const fallbackStudent = FICTIONAL_STUDENTS.find(s => s.prn === activePrn) || FICTIONAL_STUDENTS[0];
    setStudentProfile(fallbackStudent);
    setTerms([
      { semester: 1, id: 'Sem 1', label: 'Semester I', sgpa: '8.45', totalCR: 20, totalEC: 20, status: 'Declared', isPublished: true },
      { semester: 2, id: 'Sem 2', label: 'Semester II', sgpa: '8.60', totalCR: 20, totalEC: 20, status: 'Declared', isPublished: true },
      { semester: 3, id: 'Sem 3', label: 'Semester III', sgpa: '8.55', totalCR: 22, totalEC: 22, status: 'Declared', isPublished: true },
      { semester: 4, id: 'Sem 4', label: 'Semester IV', sgpa: '8.80', totalCR: 22, totalEC: 22, status: 'Declared', isPublished: true },
      { semester: 5, id: 'Sem 5', label: 'Semester V (Current)', sgpa: '8.71', totalCR: 21, totalEC: 21, status: 'Declared', isPublished: true, academicYear: '2024-2025' },
      { semester: 6, id: 'Sem 6', label: 'Semester VI', status: 'In Progress', isPublished: false },
      { semester: 7, id: 'Sem 7', label: 'Semester VII', status: 'Upcoming Term', isPublished: false },
      { semester: 8, id: 'Sem 8', label: 'Semester VIII', status: 'Upcoming Term', isPublished: false },
    ]);
  };

  /**
   * Fetch specific semester result from authoritative backend
   */
  const fetchSemesterResult = async (semNumber, academicYr) => {
    setLoadingResult(true);
    setResultError(null);
    setDownloadError(null);
    try {
      const url = `${API_BASE}/student/result?prn=${encodeURIComponent(activePrn)}&semester=${semNumber}${academicYr ? `&academicYear=${encodeURIComponent(academicYr)}` : ''}`;
      const res = await fetch(url, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setMarksheetData(data.data);
        } else {
          setMarksheetData(null);
        }
      } else if (res.status === 403) {
        // Result is in draft, submitted, or approved state but NOT yet published
        const errorData = await res.json().catch(() => ({}));
        setMarksheetData(null);
        setResultError({
          status: 403,
          title: 'Statement of Grades Under Verification',
          message: errorData.message || `Examination results for Semester ${semNumber} are currently under moderation by the Examination Cell and have not been declared yet.`,
          reviewStatus: errorData.reviewStatus || 'Pending Moderation',
        });
      } else {
        // Result does not exist for this semester
        const errorData = await res.json().catch(() => ({}));
        setMarksheetData(null);
        setResultError({
          status: res.status,
          title: `Semester ${semNumber} Results Not Declared`,
          message: errorData.message || `No published Statement of Grades found for Semester ${semNumber}.`,
          reviewStatus: 'Not Declared',
        });
      }
    } catch (err) {
      console.warn('[StudentDashboard] Error fetching semester result:', err.message);
      // Fallback to fictional marksheet if available
      if (semNumber === 5 && FICTIONAL_MARKSHEETS[activePrn]) {
        setMarksheetData(FICTIONAL_MARKSHEETS[activePrn]);
      } else {
        setMarksheetData(null);
        setResultError({
          status: 404,
          title: `Semester ${semNumber} Results Not Available`,
          message: 'The academic session for this semester has not concluded evaluation.',
          reviewStatus: 'Not Declared',
        });
      }
    } finally {
      setLoadingResult(false);
    }
  };

  /**
   * Download official Statement of Grades PDF directly from server
   */
  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    setDownloadError(null);
    try {
      const url = `${API_BASE}/marksheet/${encodeURIComponent(activePrn)}/pdf?semester=${selectedSemNum}&academicYear=${encodeURIComponent(selectedAcademicYear)}`;
      const res = await fetch(url, {
        credentials: 'include',
      });

      if (!res.ok) {
        let errMsg = 'Failed to generate Statement of Grades PDF.';
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      // Convert to blob and download
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Statement_of_Grades_${activePrn}_Sem${selectedSemNum}.pdf`;
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

  // Active student display fields
  const displayStudent = studentProfile || FICTIONAL_STUDENTS[0];
  const activeTermInfo = terms.find(t => t.semester === selectedSemNum);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Profile Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-blue-800/40 relative overflow-hidden">
        {/* Subtle background crest / texture */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 transform skew-x-12 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <GraduationCap className="w-9 h-9 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-400 text-blue-950 px-2.5 py-0.5 rounded font-mono shadow-xs">
                  PRN: {displayStudent.prn}
                </span>
                <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded backdrop-blur-xs">
                  Seat: {displayStudent.seatNo || 'SCOE24'}
                </span>
                <span className="text-xs font-medium text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {displayStudent.status || 'Active Candidate'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                {displayStudent.name}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5 flex flex-wrap items-center gap-x-2">
                <span>{displayStudent.degree || 'B.Tech'}</span>
                <span>•</span>
                <span className="font-semibold text-amber-200">{displayStudent.branch || 'Computer Engineering'}</span>
                <span>•</span>
                <span>Sanjivani Autonomous Institute</span>
              </p>
              <div className="flex flex-wrap items-center gap-x-4 text-xs text-blue-200 mt-2">
                <span>Mother's Name: <strong className="text-white">{displayStudent.motherName || 'NOT SPECIFIED'}</strong></span>
                <span>Academic Session: <strong className="text-white">{displayStudent.academicYear || selectedAcademicYear}</strong></span>
                <span>Current Term: <strong className="text-white">Semester {displayStudent.currentSemester || 5}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Actions in Banner */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            {marksheetData ? (
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {downloadingPdf ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Statement of Grades (PDF)</span>
                  </>
                )}
              </button>
            ) : null}

            <button
              onClick={() => {
                if (setSelectedPrn) setSelectedPrn(activePrn);
                setCurrentView('marksheet');
              }}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Screen Marksheet Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Download Error Banner if any */}
      {downloadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span><strong>PDF Download Notice:</strong> {downloadError}</span>
          </div>
          <button
            onClick={() => setDownloadError(null)}
            className="text-red-700 font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Performance Highlights (Shows live published marksheet data or semester summary) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Semester SGPA
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-900">
              {marksheetData ? (marksheetData.sgpa?.toFixed(2) || '0.00') : (activeTermInfo?.sgpa || '--')}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ 10.00</span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            {marksheetData?.resultStatus?.includes('DISTINCTION') 
              ? 'First Class with Distinction' 
              : marksheetData?.resultStatus || 'Performance Declared'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Cumulative CGPA
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-900">
              {marksheetData?.cgpa ? marksheetData.cgpa.toFixed(2) : (displayStudent.cgpa?.toFixed(2) || '8.71')}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ 10.00</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Autonomous Progressive Average
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Credits Earned (EC)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-800">
              {marksheetData ? marksheetData.totalEC : (activeTermInfo?.totalEC || '--')}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              / {marksheetData ? marksheetData.totalCR : (activeTermInfo?.totalCR || '--')} CR
            </span>
          </div>
          <p className="text-xs text-blue-600 font-medium mt-1">
            {marksheetData && marksheetData.totalEC === marksheetData.totalCR 
              ? '100% Term Completion' 
              : 'Credit Points: ' + (marksheetData?.totalGP || '--')}
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
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> All evaluated courses cleared
          </p>
        </div>
      </div>

      {/* Main Semester History and Statement of Grades Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-900" />
              <span>Academic Progression & Official Grades</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an academic term below to inspect verified course grades, earned credits, or download your official Statement of Grades PDF.
            </p>
          </div>

          {/* Academic Session Selector & Candidate Switcher (for COE/Faculty demo) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold">Academic Year:</span>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2022-2023">2022-2023</option>
              </select>
            </div>

            {/* If user is not restricted student, allow switching candidate for inspection */}
            {user?.role !== 'Student' && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold">Switch PRN:</span>
                <select
                  value={activePrn}
                  onChange={(e) => {
                    setActivePrn(e.target.value);
                    if (setSelectedPrn) setSelectedPrn(e.target.value);
                  }}
                  className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
                >
                  {FICTIONAL_STUDENTS.map((s) => (
                    <option key={s.prn} value={s.prn}>
                      {s.prn} - {s.name.split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Semester Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {terms.map((sem) => {
            const isSelected = selectedSemNum === sem.semester;
            const isDeclared = sem.status === 'Declared' && sem.isPublished;
            const isPending = sem.status === 'Pending Moderation';
            const isInProgress = sem.status === 'In Progress';

            return (
              <button
                key={sem.semester}
                onClick={() => {
                  setSelectedSemNum(sem.semester);
                  if (sem.academicYear) setSelectedAcademicYear(sem.academicYear);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-900 text-white shadow-sm ring-2 ring-blue-900/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{sem.label}</span>
                {isDeclared ? (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-200 text-slate-700 font-semibold'
                  }`}>
                    SGPA: {sem.sgpa}
                  </span>
                ) : isPending ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-amber-100 text-amber-800">
                    Moderation
                  </span>
                ) : isInProgress ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-100 text-blue-800">
                    Current
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-500">
                    Upcoming
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Semester Content Area */}
        {loadingResult ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-600">
              Retrieving verified Statement of Grades from Examination Cell database...
            </p>
          </div>
        ) : marksheetData ? (
          /* Published Marksheet View */
          <div className="space-y-4">
            {/* Action Bar Above Table */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800">
                  {marksheetData.examinationName || `Semester ${selectedSemNum} Autonomous Examination`}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">Result Declared: <strong>{marksheetData.resultDate || '12-01-2025'}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {downloadingPdf ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF Marksheet</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    if (setSelectedPrn) setSelectedPrn(activePrn);
                    setCurrentView('marksheet');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print View</span>
                </button>
              </div>
            </div>

            {/* Official Subject Grades Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/90 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Course Code</th>
                    <th className="py-3 px-4">Course Title</th>
                    <th className="py-3 px-3 text-center">Type</th>
                    <th className="py-3 px-3 text-center">Credits (CR)</th>
                    <th className="py-3 px-3 text-center">Earned (EC)</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                    <th className="py-3 px-3 text-center">Grade Point (GP)</th>
                    <th className="py-3 px-3 text-right">Credit Points</th>
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
                        <span className={`px-2 py-0.5 rounded text-xs font-black ${
                          sub.grade === 'O' ? 'bg-purple-100 text-purple-900' :
                          sub.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-900' :
                          sub.grade === 'F' ? 'bg-red-100 text-red-900' :
                          'bg-blue-100 text-blue-900'
                        }`}>
                          {sub.grade}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{sub.gradePoints ?? sub.gradePoint ?? 0}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {sub.creditPoints ?? (sub.credits * (sub.gradePoints || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-xs text-slate-800 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan="3" className="py-3 px-4 text-slate-600 uppercase">
                      Semester Total
                    </td>
                    <td className="py-3 px-3 text-center text-slate-900">{marksheetData.totalCR}</td>
                    <td className="py-3 px-3 text-center text-slate-900">{marksheetData.totalEC}</td>
                    <td className="py-3 px-3 text-center text-slate-400">-</td>
                    <td className="py-3 px-3 text-center text-slate-400">-</td>
                    <td className="py-3 px-3 text-right text-blue-900 font-black">{marksheetData.totalGP}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Performance Summary Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center font-black text-sm shrink-0">
                  {marksheetData.sgpa?.toFixed(2) || '0.00'}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500">Official SGPA</span>
                  <p className="font-bold text-slate-900">Autonomous Credit-Weighted Average</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500">Academic Standing</span>
                  <p className="font-bold text-emerald-800">{marksheetData.resultStatus || 'PASS'}</p>
                </div>
              </div>

              <div className="flex items-center justify-start md:justify-end gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Verified PDF</span>
                </button>
              </div>
            </div>
          </div>
        ) : resultError?.status === 403 ? (
          /* Strict Empty State for Results Pending Moderation (Never shows draft/unmoderated marks) */
          <EmptyState
            title="Statement of Grades Under Verification"
            description={resultError.message || `Your examination results for Semester ${selectedSemNum} are currently undergoing moderation and verification by the Examination Cell and have not been declared yet.`}
            badgeText={`Status: ${resultError.reviewStatus || 'Pending Moderation'}`}
            icon={Clock}
            actionLabel="Return to Current Active Semester"
            onAction={() => setSelectedSemNum(5)}
          />
        ) : selectedSemNum === 6 ? (
          /* Empty State for Upcoming Semester VI */
          <EmptyState
            title="Semester VI Results Not Declared"
            description="The academic session for Semester VI is currently in session. Official Statement of Grades will be published here by the Examination Cell following conclusion of the summer autonomous exams."
            badgeText="Academic Term In Progress"
            icon={Inbox}
            actionLabel="Return to Semester V"
            onAction={() => setSelectedSemNum(5)}
          />
        ) : (
          /* Generic Empty State for Archive or Non-Declared Term */
          <EmptyState
            title={resultError?.title || `Semester ${selectedSemNum} Results Unavailable`}
            description={resultError?.message || `No published Statement of Grades found for Semester ${selectedSemNum}. Marksheets are generated following conclusion of evaluations.`}
            badgeText="Status: Not Published"
            icon={Inbox}
            actionLabel="Back to Active Semester V"
            onAction={() => setSelectedSemNum(5)}
          />
        )}
      </div>
    </div>
  );
}
