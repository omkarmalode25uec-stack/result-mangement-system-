import React from 'react';
import { Award, ShieldCheck } from 'lucide-react';
import { COLLEGE_INFO } from '../data/fictionalData';

export default function SanjivaniHeader({ showWatermark = false, examinationSession }) {
  return (
    <div className="relative border-b-2 border-slate-900 pb-4 text-center">
      {/* Visual Logo / Seal Placeholder */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
        {/* Left Emblem Placeholder */}
        <div className="flex items-center gap-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-blue-900 bg-blue-50 flex flex-col items-center justify-center p-1 shadow-xs text-center">
            <span className="text-[9px] font-black tracking-tighter text-blue-950 uppercase leading-tight">SRES</span>
            <ShieldCheck className="w-6 h-6 text-blue-800 my-0.5" />
            <span className="text-[7px] font-semibold text-slate-600">ESTD 1983</span>
          </div>
        </div>

        {/* Center Institutional Typography */}
        <div className="flex-1 text-center px-2">
          <h4 className="text-[11px] sm:text-xs font-bold tracking-widest text-slate-700 uppercase">
            {COLLEGE_INFO.trustName}
          </h4>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-blue-950 tracking-tight my-0.5 font-serif">
            {COLLEGE_INFO.name}
          </h1>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-800">
            {COLLEGE_INFO.status}
          </p>
          <p className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5">
            {COLLEGE_INFO.accreditation}
          </p>
          <p className="text-[9px] sm:text-[10px] text-slate-500">
            {COLLEGE_INFO.address}
          </p>
        </div>

        {/* Right NAAC / Autonomous Monogram Placeholder */}
        <div className="flex items-center gap-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-slate-700 bg-amber-50/60 flex flex-col items-center justify-center p-1 text-center shadow-xs">
            <Award className="w-5 h-5 text-amber-700" />
            <span className="text-[9px] font-extrabold text-slate-800 leading-tight">NAAC 'A'</span>
            <span className="text-[7px] font-semibold text-slate-600">AUTONOMOUS</span>
          </div>
        </div>
      </div>

      {/* Official Marksheet Banner Title */}
      <div className="mt-2 py-1.5 px-4 bg-blue-950 text-white rounded-xs">
        <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-wider font-serif uppercase">
          STATEMENT OF GRADES
        </h2>
      </div>

      {/* Examination Session Subtitle */}
      {examinationSession && (
        <div className="mt-1.5 text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
          {examinationSession}
        </div>
      )}
    </div>
  );
}
