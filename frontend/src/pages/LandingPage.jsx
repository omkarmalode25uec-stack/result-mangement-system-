import React from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  FileText, 
  Award, 
  Calendar, 
  CheckCircle2, 
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { COLLEGE_INFO } from '../data/fictionalData';

export default function LandingPage({ setCurrentView }) {
  const handleGoToStudentLogin = () => {
    if (typeof setCurrentView === 'function') {
      setCurrentView('login');
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 text-white py-16 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-800/80 border border-blue-600/50 text-blue-200 text-xs font-semibold">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{COLLEGE_INFO.trustName} • Autonomous Institute under SPPU</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-serif text-white">
              Result Management System
            </h1>

            <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Official academic performance and result verification portal for students of Sanjivani College of Engineering, Kopargaon. Access semester-wise Statement of Grades, verified grade points, and official academic transcripts.
            </p>

            {/* Public Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={handleGoToStudentLogin}
                className="w-full sm:w-auto px-7 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <FileText className="w-4 h-4" />
                <span>Check Result</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGoToStudentLogin}
                className="w-full sm:w-auto px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition-all border border-white/25 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm hover:-translate-y-0.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Student Login</span>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-center gap-6 text-xs text-blue-200">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Authentic Statement of Grades</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span>UGC 10-Point Scale</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container: Public Academic Information & Notices */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Examination Cell Notices */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-800" />
                <h3 className="text-base font-bold text-slate-900">
                  Latest Examination Cell Notices
                </h3>
              </div>
              <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Autonomous Section
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-blue-800">Academic Session 2026–27</span>
                  <span>Jan 12, 2027</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Declaration of Statement of Grades for Autonomous Semester I (B.Tech)
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Students can log in to verify course grades, earned credits, and download provisional Statement of Grades online through the student portal.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-amber-700">Revaluation & Grievance Window</span>
                  <span>Jan 16, 2027</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Application Schedule for Photocopy and Verification of Evaluated Answer Books
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Eligible candidates may submit applications through the Examination Cell within 7 working days following result publication.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-emerald-700">Academic Term Notification</span>
                  <span>Jan 20, 2027</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Commencement of Even Semester Academic Term
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Departmental course registrations for elective and laboratory courses are coordinated through departmental coordinators.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Marksheet Format Spotlight */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Official Format Overview
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2">
                Sanjivani Statement of Grades
              </h3>
              <p className="text-xs text-blue-200 leading-relaxed mb-4">
                Autonomous academic marksheets are structured per Savitribai Phule Pune University guidelines, featuring Course Code, Course Type (TH, PR, OR, TW, PE, OE), Credits (CR), Earned Credits (EC), Grade Points (GP), SGPA, and cumulative CGPA.
              </p>
              <ul className="text-xs space-y-2 text-blue-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard 10-Point UGC/SPPU Grading Scale</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>PRN & Seat Number Verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Official Downloadable Statement of Grades (PDF)</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={handleGoToStudentLogin}
                className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In to Access Your Result</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
