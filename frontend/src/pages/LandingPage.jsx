import React, { useState } from 'react';
import { 
  GraduationCap, 
  Search, 
  UserCheck, 
  ShieldAlert, 
  ArrowRight, 
  FileText, 
  Award, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { COLLEGE_INFO, FICTIONAL_STUDENTS } from '../data/fictionalData';

export default function LandingPage({ setCurrentView, setSelectedPrn }) {
  const [searchPrn, setSearchPrn] = useState('');
  const [searchFeedback, setSearchFeedback] = useState(null);

  const handleQuickLookup = (e) => {
    e.preventDefault();
    const cleanPrn = searchPrn.trim().toUpperCase();

    if (!cleanPrn) {
      setSearchFeedback({ type: 'error', message: 'Please enter a Permanent Registration Number (PRN).' });
      return;
    }

    const studentFound = FICTIONAL_STUDENTS.find(s => s.prn === cleanPrn);

    if (studentFound) {
      setSelectedPrn(cleanPrn);
      setCurrentView('marksheet');
    } else {
      setSearchFeedback({
        type: 'warning',
        message: `No published marksheet found for PRN "${cleanPrn}". You can try fictional sample PRN: 22UCO01042 or 22UIT02015.`,
      });
    }
  };

  const handleFillSample = (prn) => {
    setSearchPrn(prn);
    setSearchFeedback(null);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 text-white py-14 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 border border-blue-600/50 text-blue-200 text-xs font-semibold">
              <Award className="w-4 h-4 text-amber-400" />
              Autonomous Result Portal • Savitribai Phule Pune University
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-serif">
              Result Management System
            </h1>

            <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Official academic performance portal for students, faculty, and examination controllers of Sanjivani College of Engineering, Kopargaon.
            </p>

            {/* Quick Result Search Box */}
            <div className="pt-4 max-w-xl mx-auto">
              <form onSubmit={handleQuickLookup} className="flex flex-col sm:flex-row gap-2 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchPrn}
                    onChange={(e) => {
                      setSearchPrn(e.target.value);
                      if (searchFeedback) setSearchFeedback(null);
                    }}
                    placeholder="Enter PRN (e.g. 22UCO01042)"
                    className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 placeholder-slate-400 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>View Result</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Sample PRN helper tags */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-blue-200">
                <span>Try sample PRNs:</span>
                <button
                  type="button"
                  onClick={() => handleFillSample('22UCO01042')}
                  className="underline hover:text-white font-mono bg-blue-900/60 px-2 py-0.5 rounded cursor-pointer"
                >
                  22UCO01042 (CE)
                </button>
                <button
                  type="button"
                  onClick={() => handleFillSample('22UIT02015')}
                  className="underline hover:text-white font-mono bg-blue-900/60 px-2 py-0.5 rounded cursor-pointer"
                >
                  22UIT02015 (IT)
                </button>
              </div>

              {/* Feedback Alert if PRN not found */}
              {searchFeedback && (
                <div className={`mt-4 p-3 rounded-lg text-xs flex items-start gap-2 text-left ${
                  searchFeedback.type === 'error' ? 'bg-red-900/80 text-red-100 border border-red-700' : 'bg-amber-900/80 text-amber-100 border border-amber-700'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{searchFeedback.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Portal Access Cards */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Select Your Academic Portal
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Seamlessly access examination results, mark entry interfaces, and administrative controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all hover:border-blue-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Students
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2 mb-1">
                  Student Result Portal
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  View semester-wise SGPA, CGPA, official Statement of Grades, course credit status, and examination reports.
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">PRN Access</span>
                <button
                  onClick={() => setCurrentView('student')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  Enter Portal <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Faculty Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all hover:border-blue-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Faculty & Evaluators
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2 mb-1">
                  Faculty Grading Desk
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Submit internal assessment marks, practical viva evaluations, theory grades, and course attainment reports.
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Faculty ID Access</span>
                <button
                  onClick={() => setCurrentView('faculty')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                >
                  Enter Portal <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Admin / COE Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all hover:border-blue-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  COE & Admin
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2 mb-1">
                  Examination Cell
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Manage examination cycles, publish autonomous results, oversee grade moderation, and issue verified transcripts.
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">COE Authorized</span>
                <button
                  onClick={() => setCurrentView('admin')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-black cursor-pointer"
                >
                  Enter Portal <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Examination Announcements & Quick Status Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Notifications */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Latest Examination Cell Notices
                </h3>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Autonomous Section
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-blue-800">Winter Session 2024</span>
                  <span>Jan 12, 2025</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-800">
                  Declaration of Statement of Grades for B.Tech Semester V (Computer, IT, Civil, Mechanical)
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Students can verify their grade points and download provisional grade cards online through this portal.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-amber-700">Revaluation & Verification</span>
                  <span>Jan 14, 2025</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-800">
                  Application window for Photocopy and Grievance Verification of Answer Books
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Eligible candidates may submit requests within 7 working days from result declaration.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-emerald-700">Academic Schedule</span>
                  <span>Jan 18, 2025</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-800">
                  Commencement of Even Semester (Semester VI & VIII) Academic Term 2024-2025
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Course registrations for elective subjects (PE-II and OE-II) open on the departmental ERP.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Marksheet Format Spotlight */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Official Format Spotlight
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2">
                Sanjivani Autonomous Statement of Grades
              </h3>
              <p className="text-xs text-blue-200 leading-relaxed mb-4">
                Structured per Savitribai Phule Pune University autonomous guidelines, featuring Course Code, Course Type (TH, PR, OR, TW, PE, OE), Credits (CR), Earned Credits (EC), Grade Points (GP), SGPA and official signatures.
              </p>
              <ul className="text-xs space-y-1.5 text-blue-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Standard 10-Point UGC Grading Scale</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Integrated PRN & Seat Verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print-ready academic layout</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button
                onClick={() => {
                  setSelectedPrn('22UCO01042');
                  setCurrentView('marksheet');
                }}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <FileText className="w-4 h-4" />
                <span>Open Marksheet Preview</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
