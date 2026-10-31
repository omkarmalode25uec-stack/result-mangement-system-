import React from 'react';
import { ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { COLLEGE_INFO } from '../data/fictionalData';
import { useAuth } from '../context/AuthContext';

export default function Footer({ setCurrentView }) {
  const { user, isAuthenticated } = useAuth();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 no-print mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Institute Identity */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                SCOE
              </div>
              <h3 className="text-white font-bold text-base tracking-wide uppercase">
                {COLLEGE_INFO.name}
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {COLLEGE_INFO.trustName}
              <br />
              {COLLEGE_INFO.status}
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400" />
              <span>{COLLEGE_INFO.accreditation}</span>
            </div>
          </div>

          {/* Col 2: Navigation Links (Authorized for Current User Role) */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setCurrentView('landing')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  RMS Home
                </button>
              </li>

              {!isAuthenticated && (
                <li>
                  <button
                    onClick={() => setCurrentView('login')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Student Login
                  </button>
                </li>
              )}

              {isAuthenticated && user?.role === 'Student' && (
                <li>
                  <button
                    onClick={() => setCurrentView('student')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Student Dashboard
                  </button>
                </li>
              )}

              {isAuthenticated && user?.role === 'Faculty' && (
                <li>
                  <button
                    onClick={() => setCurrentView('faculty')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Faculty Dashboard
                  </button>
                </li>
              )}

              {isAuthenticated && user?.role === 'Admin' && (
                <li>
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    COE / Admin Dashboard
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Examination Cell Contact */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">
              Examination Cell
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                <span>Sahajanandnagar, Post Shingnapur, Kopargaon - 423603, Dist: Ahmednagar (M.S.)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-slate-400" />
                <a href="mailto:examcell@sanjivani.edu.in" className="hover:text-white transition-colors">
                  examcell@sanjivani.edu.in
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                <span>+91 (02423) 222862 / 223362</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Sanjivani College of Engineering, Kopargaon. All rights reserved.</p>
          <p className="text-[11px] text-slate-400">
            Autonomous Examination Division • Savitribai Phule Pune University
          </p>
        </div>
      </div>
    </footer>
  );
}
