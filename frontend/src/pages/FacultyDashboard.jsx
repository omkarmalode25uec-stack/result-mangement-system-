import React, { useState } from 'react';
import { 
  UserCheck, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Clock, 
  Search, 
  FileSpreadsheet, 
  Filter, 
  ChevronRight,
  Inbox
} from 'lucide-react';
import { FACULTY_COURSES, FICTIONAL_STUDENTS } from '../data/fictionalData';
import EmptyState from '../components/EmptyState';

export default function FacultyDashboard({ setCurrentView, setSelectedPrn }) {
  const [selectedCourse, setSelectedCourse] = useState(FACULTY_COURSES[0].code);
  const [showEmptySection, setShowEmptySection] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const activeCourse = FACULTY_COURSES.find(c => c.code === selectedCourse);

  const filteredStudents = FICTIONAL_STUDENTS.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.prn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Faculty Profile Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0">
              <UserCheck className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider bg-indigo-500 text-white px-2 py-0.5 rounded">
                  Faculty In-Charge
                </span>
                <span className="text-xs text-blue-200">ID: FAC-CS-108</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                Prof. R. M. Kulkarni
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
                Associate Professor • Department of Computer Engineering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmptySection(!showEmptySection)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {showEmptySection ? 'Show Normal View' : 'Preview Empty Course State'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Course Management Section */}
      {showEmptySection ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <EmptyState
            title="No Pending Grade Evaluations Found"
            description="All student marks and internal evaluations for this academic session have been audited and forwarded to the Examination Cell."
            badgeText="Evaluation Completed"
            icon={Inbox}
            actionLabel="Return to Active Courses"
            onAction={() => setShowEmptySection(false)}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Assigned Courses Cards */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Assigned Courses • Winter 2024 Examination Session
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FACULTY_COURSES.map((course) => {
                const isSelected = selectedCourse === course.code;
                return (
                  <div
                    key={course.code}
                    onClick={() => setSelectedCourse(course.code)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded">
                          {course.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          course.statusBadge === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : course.statusBadge === 'Submitted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {course.evaluationStatus}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {course.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {course.type} • {course.credits} Credits • {course.semester}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <strong>{course.studentsEnrolled}</strong> Students
                      </span>
                      <span className="text-blue-700 font-semibold text-[11px]">
                        Select to View →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Course Grade Table */}
          {activeCourse && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                      {activeCourse.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {activeCourse.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Enrolled Students Assessment & Grade Entry Sheet
                  </p>
                </div>

                {/* Search in Student Roster */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by student or PRN..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">PRN</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Seat Number</th>
                      <th className="py-3 px-3 text-center">Division</th>
                      <th className="py-3 px-3 text-center">Internal (30)</th>
                      <th className="py-3 px-3 text-center">ESE (70)</th>
                      <th className="py-3 px-3 text-center">Assigned Grade</th>
                      <th className="py-3 px-4 text-right">Marksheet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student, idx) => (
                        <tr key={student.prn} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-blue-950">
                            {student.prn}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {student.name}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {student.seatNo}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600">
                            {student.division}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                            28
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                            62
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-100 text-emerald-900">
                              {idx === 0 ? 'A+' : 'O'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedPrn(student.prn);
                                setCurrentView('marksheet');
                              }}
                              className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                            >
                              Preview Card →
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-400">
                          No student matching "{searchTerm}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
