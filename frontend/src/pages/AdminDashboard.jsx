import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  BookOpen, 
  Layers, 
  UserCheck, 
  Search, 
  Plus, 
  Upload, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Power,
  RotateCcw,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { COLLEGE_INFO } from '../data/fictionalData';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminDashboard({ setCurrentView, setSelectedPrn }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'faculty' | 'subjects' | 'structure' | 'assignments'

  // Notification banners
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // ==========================================================================
  // TAB 1: STUDENTS STATE
  // ==========================================================================
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentBranch, setStudentBranch] = useState('');
  const [studentSemester, setStudentSemester] = useState('');
  const [studentStatus, setStudentStatus] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentTotal, setStudentTotal] = useState(0);

  // Student Modals
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [confirmDeactivateStudent, setConfirmDeactivateStudent] = useState(null); // student object

  // Create Student Form
  const [studentForm, setStudentForm] = useState({
    prn: '',
    name: '',
    motherName: '',
    seatNo: '',
    rollNo: '',
    branch: 'Computer Engineering',
    department: 'Department of Computer Engineering',
    academicYear: '2024-2025',
    currentSemester: 5,
    email: '',
    phone: '',
    password: 'Student@123',
  });

  // Edit Student Form
  const [editStudentForm, setEditStudentForm] = useState(null);

  // CSV Import Form
  const [csvContent, setCsvContent] = useState('');
  const [csvReport, setCsvReport] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

  // ==========================================================================
  // TAB 2: FACULTY STATE
  // ==========================================================================
  const [facultyList, setFacultyList] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [facultySearch, setFacultySearch] = useState('');
  const [facultyDept, setFacultyDept] = useState('');
  const [facultyPage, setFacultyPage] = useState(1);
  const [facultyTotalPages, setFacultyTotalPages] = useState(1);
  const [showCreateFacultyModal, setShowCreateFacultyModal] = useState(false);
  const [showEditFacultyModal, setShowEditFacultyModal] = useState(false);
  const [facultyForm, setFacultyForm] = useState({
    employeeId: '',
    name: '',
    department: 'Computer Engineering',
    designation: 'Associate Professor',
    email: '',
    phone: '',
    specialization: '',
    password: 'Faculty@123',
  });
  const [editFacultyForm, setEditFacultyForm] = useState(null);

  // ==========================================================================
  // TAB 3: SUBJECTS STATE
  // ==========================================================================
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectSemester, setSubjectSemester] = useState('');
  const [subjectDept, setSubjectDept] = useState('');
  const [subjectType, setSubjectType] = useState('');
  const [subjectPage, setSubjectPage] = useState(1);
  const [subjectTotalPages, setSubjectTotalPages] = useState(1);
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    subjectCode: '',
    subjectName: '',
    subjectType: 'TH',
    credits: 3,
    semester: 5,
    department: 'Computer Engineering',
    maxInternalMarks: 30,
    maxEseMarks: 70,
  });

  // ==========================================================================
  // TAB 4: ACADEMIC STRUCTURE STATE (Departments & Sessions)
  // ==========================================================================
  const [departments, setDepartments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ code: '', name: '', hodName: '' });
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    academicYear: '2024-2025',
    semester: 6,
    semesterLabel: 'Semester VI',
    term: 'Even',
    examinationSession: 'Summer 2025 Autonomous Examination',
    isCurrent: false,
  });

  // ==========================================================================
  // TAB 5: FACULTY-SUBJECT ASSIGNMENTS
  // ==========================================================================
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    facultyId: '',
    subjectId: '',
    academicYear: '2024-2025',
    semester: 5,
    division: 'A',
  });

  // ==========================================================================
  // DATA FETCHING FUNCTIONS
  // ==========================================================================
  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const params = new URLSearchParams({
        page: studentPage,
        limit: 8,
        search: studentSearch,
        branch: studentBranch,
        semester: studentSemester,
        status: studentStatus,
      });
      const res = await fetch(`${API_BASE}/admin/students?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
        setStudentTotalPages(data.totalPages);
        setStudentTotal(data.total);
      }
    } catch (err) {
      console.warn('Could not fetch students from API:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchFaculty = async () => {
    setFacultyLoading(true);
    try {
      const params = new URLSearchParams({
        page: facultyPage,
        limit: 8,
        search: facultySearch,
        department: facultyDept,
      });
      const res = await fetch(`${API_BASE}/admin/faculty?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setFacultyList(data.data);
        setFacultyTotalPages(data.totalPages);
      }
    } catch (err) {
      console.warn('Could not fetch faculty from API:', err);
    } finally {
      setFacultyLoading(false);
    }
  };

  const fetchSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const params = new URLSearchParams({
        page: subjectPage,
        limit: 8,
        search: subjectSearch,
        semester: subjectSemester,
        department: subjectDept,
        type: subjectType,
      });
      const res = await fetch(`${API_BASE}/admin/subjects?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSubjects(data.data);
        setSubjectTotalPages(data.totalPages);
      }
    } catch (err) {
      console.warn('Could not fetch subjects from API:', err);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const fetchStructure = async () => {
    try {
      const [deptRes, sessRes] = await Promise.all([
        fetch(`${API_BASE}/admin/departments`, { credentials: 'include' }),
        fetch(`${API_BASE}/admin/sessions`, { credentials: 'include' }),
      ]);
      const deptData = await deptRes.json();
      const sessData = await sessRes.json();
      if (deptData.success) setDepartments(deptData.data);
      if (sessData.success) setSessions(sessData.data);
    } catch (err) {
      console.warn('Could not fetch structure:', err);
    }
  };

  const fetchAssignments = async () => {
    setAssignmentsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/assignments`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setAssignments(data.data);
    } catch (err) {
      console.warn('Could not fetch assignments:', err);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  // Load initial tab data
  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    if (activeTab === 'faculty') fetchFaculty();
    if (activeTab === 'subjects') fetchSubjects();
    if (activeTab === 'structure') fetchStructure();
    if (activeTab === 'assignments') {
      fetchAssignments();
      fetchFaculty();
      fetchSubjects();
    }
  }, [
    activeTab, 
    studentPage, 
    studentSearch, 
    studentBranch, 
    studentSemester, 
    studentStatus,
    facultyPage,
    facultySearch,
    facultyDept,
    subjectPage,
    subjectSearch,
    subjectSemester,
    subjectDept,
    subjectType
  ]);

  // ==========================================================================
  // ACTION HANDLERS
  // ==========================================================================

  // Create Student
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/admin/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(studentForm),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Candidate ${studentForm.name} (${studentForm.prn}) created with authorized credentials!` });
        setShowCreateStudentModal(false);
        setStudentForm({
          prn: '',
          name: '',
          motherName: '',
          seatNo: '',
          rollNo: '',
          branch: 'Computer Engineering',
          department: 'Department of Computer Engineering',
          academicYear: '2024-2025',
          currentSemester: 5,
          email: '',
          phone: '',
          password: 'Student@123',
        });
        fetchStudents();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to create student.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Server connection error.' });
    }
  };

  // Edit Student
  const handleEditStudent = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/admin/students/${editStudentForm._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editStudentForm),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Student ${editStudentForm.prn} updated successfully.` });
        setShowEditStudentModal(false);
        fetchStudents();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Update failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Server connection error.' });
    }
  };

  // Toggle Student Deactivation
  const handleToggleStudentStatus = async (student) => {
    const newStatus = student.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`${API_BASE}/admin/students/${student._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Student ${student.prn} status changed to ${newStatus}. Historical result records preserved.`,
        });
        setConfirmDeactivateStudent(null);
        fetchStudents();
      } else {
        setFeedback({ type: 'error', message: data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Server error updating status.' });
    }
  };

  // CSV Import
  const handleCsvImport = async (e) => {
    e.preventDefault();
    setCsvLoading(true);
    setCsvReport(null);
    try {
      const res = await fetch(`${API_BASE}/admin/students/import-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ csvContent }),
      });
      const data = await res.json();
      if (data.success) {
        setCsvReport(data);
        if (data.importedCount > 0) {
          fetchStudents();
        }
      } else {
        setFeedback({ type: 'error', message: data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Error processing CSV.' });
    } finally {
      setCsvLoading(false);
    }
  };

  // Create Faculty
  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/admin/faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(facultyForm),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Faculty ${facultyForm.name} (${facultyForm.employeeId}) account created successfully!` });
        setShowCreateFacultyModal(false);
        setFacultyForm({
          employeeId: '',
          name: '',
          department: 'Computer Engineering',
          designation: 'Associate Professor',
          email: '',
          phone: '',
          specialization: '',
          password: 'Faculty@123',
        });
        fetchFaculty();
      } else {
        setFeedback({ type: 'error', message: data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Server connection error.' });
    }
  };

  // Toggle Faculty Status
  const handleToggleFacultyStatus = async (faculty) => {
    const newActive = !faculty.isActive;
    try {
      const res = await fetch(`${API_BASE}/admin/faculty/${faculty._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: newActive }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Faculty ${faculty.employeeId} set to ${newActive ? 'Active' : 'Inactive'}.` });
        fetchFaculty();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Server connection error.' });
    }
  };

  // Create Subject
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/admin/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(subjectForm),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Course ${subjectForm.subjectCode} (${subjectForm.subjectName}) created successfully!` });
        setShowCreateSubjectModal(false);
        setSubjectForm({
          subjectCode: '',
          subjectName: '',
          subjectType: 'TH',
          credits: 3,
          semester: 5,
          department: 'Computer Engineering',
          maxInternalMarks: 30,
          maxEseMarks: 70,
        });
        fetchSubjects();
      } else {
        setFeedback({ type: 'error', message: data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Server connection error.' });
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete course ${code}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/subjects/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Subject ${code} deleted.` });
        fetchSubjects();
      } else {
        setFeedback({ type: 'error', message: data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Server connection error.' });
    }
  };

  // Assign Faculty to Subject
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/admin/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(assignmentForm),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        setShowAssignModal(false);
        fetchAssignments();
      } else {
        setFeedback({ type: 'error', message: data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Server connection error.' });
    }
  };

  // Revoke Assignment
  const handleRevokeAssignment = async (id) => {
    if (!window.confirm('Revoke this faculty allocation?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/assignments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Faculty course assignment revoked.' });
        fetchAssignments();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Server connection error.' });
    }
  };

  // Create Department
  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(deptForm),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Department ${deptForm.name} created.` });
        setShowDeptModal(false);
        setDeptForm({ code: '', name: '', hodName: '' });
        fetchStructure();
      } else {
        setFeedback({ type: 'error', message: data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Server connection error.' });
    }
  };

  // Create Academic Session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(sessionForm),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Academic Session for ${sessionForm.academicYear} Sem ${sessionForm.semester} created.` });
        setShowSessionModal(false);
        fetchStructure();
      } else {
        setFeedback({ type: 'error', message: data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Server connection error.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0">
              <ShieldAlert className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-500 text-blue-950 px-2 py-0.5 rounded">
                  Autonomous Examination Authority
                </span>
                <span className="text-xs text-blue-200">
                  {user ? `Officer: ${user.name}` : 'COE Control Center'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                Academic Management & Control Desk
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
                {COLLEGE_INFO.name} • Stage 3 Administration Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-800/80 px-3 py-1.5 rounded-lg border border-blue-600/60 font-mono text-blue-100">
              Session: 2024-2025 (Autonomous)
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-semibold transition-all shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-red-50 text-red-900 border border-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Administrative Navigation Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-xl flex items-center gap-1 overflow-x-auto shadow-inner text-xs sm:text-sm font-bold">
        <button
          onClick={() => { setActiveTab('students'); setFeedback(null); }}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'students' ? 'bg-white text-blue-950 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-blue-700" />
          <span>Student Records</span>
        </button>

        <button
          onClick={() => { setActiveTab('faculty'); setFeedback(null); }}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'faculty' ? 'bg-white text-blue-950 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4 text-indigo-700" />
          <span>Faculty Accounts</span>
        </button>

        <button
          onClick={() => { setActiveTab('subjects'); setFeedback(null); }}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'subjects' ? 'bg-white text-blue-950 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>Course Catalog</span>
        </button>

        <button
          onClick={() => { setActiveTab('assignments'); setFeedback(null); }}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'assignments' ? 'bg-white text-blue-950 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-700" />
          <span>Faculty Allocations</span>
        </button>

        <button
          onClick={() => { setActiveTab('structure'); setFeedback(null); }}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'structure' ? 'bg-white text-blue-950 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-700" />
          <span>Departments & Sessions</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: STUDENT MANAGEMENT                                             */}
      {/* ===================================================================== */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Student Enrollment & Record Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Registered: <strong>{studentTotal}</strong> candidates • Assign unique PRNs, update details, or deactivate records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowCsvModal(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Upload className="w-4 h-4 text-blue-700" />
                <span>Import CSV</span>
              </button>

              <button
                onClick={() => setShowCreateStudentModal(true)}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Student</span>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="relative sm:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
                placeholder="Search PRN, name, seat..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={studentBranch}
              onChange={(e) => { setStudentBranch(e.target.value); setStudentPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All Branches</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
            </select>

            <select
              value={studentSemester}
              onChange={(e) => { setStudentSemester(e.target.value); setStudentPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>

            <select
              value={studentStatus}
              onChange={(e) => { setStudentStatus(e.target.value); setStudentPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive / Deactivated</option>
            </select>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PRN</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-3">Seat No.</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-3 text-center">Sem</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsLoading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">Loading student directory...</td>
                  </tr>
                ) : students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student._id || student.prn} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-950">
                        {student.prn}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-[10px] text-slate-400">Mother: {student.motherName}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{student.seatNo}</td>
                      <td className="py-3 px-4 text-slate-700">{student.branch}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{student.currentSemester}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          student.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {student.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditStudentForm({ ...student });
                            setShowEditStudentModal(true);
                          }}
                          className="px-2 py-1 text-slate-700 hover:text-blue-900 font-semibold cursor-pointer text-xs"
                          title="Edit Student Details"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => setConfirmDeactivateStudent(student)}
                          className={`px-2 py-1 font-semibold rounded cursor-pointer text-xs ${
                            student.status === 'Active'
                              ? 'text-red-700 hover:bg-red-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {student.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => {
                            setSelectedPrn(student.prn);
                            setCurrentView('marksheet');
                          }}
                          className="px-2 py-1 text-blue-700 font-bold hover:underline cursor-pointer text-xs"
                        >
                          Preview →
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No student records found matching query criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>Page {studentPage} of {studentTotalPages} ({studentTotal} students)</span>
            <div className="flex items-center gap-1">
              <button
                disabled={studentPage <= 1}
                onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-800">{studentPage}</span>
              <button
                disabled={studentPage >= studentTotalPages}
                onClick={() => setStudentPage(p => Math.min(studentTotalPages, p + 1))}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: FACULTY MANAGEMENT                                             */}
      {/* ===================================================================== */}
      {activeTab === 'faculty' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Faculty Accounts & Department Directory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized academic personnel with internal marks submission privileges.
              </p>
            </div>

            <button
              onClick={() => setShowCreateFacultyModal(true)}
              className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Faculty Member</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={facultySearch}
                onChange={(e) => { setFacultySearch(e.target.value); setFacultyPage(1); }}
                placeholder="Search by Employee ID, name, or email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={facultyDept}
              onChange={(e) => { setFacultyDept(e.target.value); setFacultyPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All Departments</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
            </select>
          </div>

          {/* Faculty Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Faculty Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-3">Designation</th>
                  <th className="py-3 px-4">Official Email</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facultyLoading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">Loading faculty directory...</td>
                  </tr>
                ) : facultyList.length > 0 ? (
                  facultyList.map((f) => (
                    <tr key={f._id || f.employeeId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-950">
                        {f.employeeId}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{f.name}</td>
                      <td className="py-3 px-4 text-slate-700">{f.department}</td>
                      <td className="py-3 px-3 text-slate-600">{f.designation}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{f.email}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          f.isActive !== false
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {f.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditFacultyForm({ ...f });
                            setShowEditFacultyModal(true);
                          }}
                          className="px-2 py-1 text-slate-700 hover:text-indigo-900 font-semibold cursor-pointer text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleFacultyStatus(f)}
                          className={`px-2 py-1 font-semibold rounded cursor-pointer text-xs ${
                            f.isActive !== false
                              ? 'text-amber-700 hover:bg-amber-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {f.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No faculty members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SUBJECTS & COURSE CATALOG                                      */}
      {/* ===================================================================== */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Institutional Course Catalog & Mark Limits
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage curriculum subjects, assign course types (TH, PR, TW, OR), credits (1-10), and marks limits.
              </p>
            </div>

            <button
              onClick={() => setShowCreateSubjectModal(true)}
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Course</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={subjectSearch}
                onChange={(e) => { setSubjectSearch(e.target.value); setSubjectPage(1); }}
                placeholder="Search course code or name..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={subjectSemester}
              onChange={(e) => { setSubjectSemester(e.target.value); setSubjectPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>

            <select
              value={subjectType}
              onChange={(e) => { setSubjectType(e.target.value); setSubjectPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All Types (TH, PR, OR, TW, PE, OE)</option>
              <option value="TH">Theory (TH)</option>
              <option value="PR">Practical (PR)</option>
              <option value="TW">Term Work (TW)</option>
              <option value="OR">Oral / Viva (OR)</option>
              <option value="PE">Professional Elective (PE)</option>
              <option value="OE">Open Elective (OE)</option>
            </select>

            <select
              value={subjectDept}
              onChange={(e) => { setSubjectDept(e.target.value); setSubjectPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All Departments</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Civil Engineering">Civil Engineering</option>
            </select>
          </div>

          {/* Subjects Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-3 text-center">Type</th>
                  <th className="py-3 px-3 text-center">Credits</th>
                  <th className="py-3 px-3 text-center">Sem</th>
                  <th className="py-3 px-3 text-center">Internal / ESE</th>
                  <th className="py-3 px-3 text-center">Total Max</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectsLoading ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">Loading course catalog...</td>
                  </tr>
                ) : subjects.length > 0 ? (
                  subjects.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-950">{s.subjectCode}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{s.subjectName}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700">
                          {s.subjectType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{s.credits}</td>
                      <td className="py-3 px-3 text-center font-mono">{s.semester}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {s.maxInternalMarks} / {s.maxEseMarks}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {s.totalMaxMarks}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteSubject(s._id, s.subjectCode)}
                          className="p-1 text-slate-400 hover:text-red-700 rounded transition-colors cursor-pointer"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No subjects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: FACULTY-SUBJECT ALLOCATIONS                                    */}
      {/* ===================================================================== */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Faculty-Subject Course Allocations
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign authorized instructors to teach and evaluate subjects by academic year and division.
              </p>
            </div>

            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Course to Faculty</span>
            </button>
          </div>

          {/* Assignments Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Assigned Course</th>
                  <th className="py-3 px-3 text-center">Semester</th>
                  <th className="py-3 px-3 text-center">Division</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignmentsLoading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">Loading allocations...</td>
                  </tr>
                ) : assignments.length > 0 ? (
                  assignments.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{a.faculty?.name || 'Assigned Instructor'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{a.faculty?.employeeId} • {a.faculty?.department}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold font-mono text-purple-950">{a.subject?.subjectCode}</div>
                        <div className="text-slate-600">{a.subject?.subjectName} ({a.subject?.subjectType})</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{a.semester}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold bg-slate-50">{a.division}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{a.academicYear}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {a.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRevokeAssignment(a._id)}
                          className="px-2.5 py-1 text-red-700 hover:bg-red-50 rounded font-semibold text-xs cursor-pointer border border-red-200"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active allocations. Click "Assign Course to Faculty" above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: DEPARTMENTS & SESSIONS                                         */}
      {/* ===================================================================== */}
      {activeTab === 'structure' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Departments Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Academic Departments</h3>
                <p className="text-xs text-slate-500">Autonomous engineering disciplines</p>
              </div>
              <button
                onClick={() => setShowDeptModal(true)}
                className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 text-xs font-bold rounded-lg cursor-pointer"
              >
                + Add Dept
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {departments.map(d => (
                <div key={d._id || d.code} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{d.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">Code: {d.code} | HOD: {d.hodName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Sessions Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Academic Sessions & Semesters</h3>
                <p className="text-xs text-slate-500">Terms and examination cycles</p>
              </div>
              <button
                onClick={() => setShowSessionModal(true)}
                className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 text-xs font-bold rounded-lg cursor-pointer"
              >
                + Add Session
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {sessions.map(s => (
                <div key={s._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{s.academicYear} • {s.semesterLabel} ({s.term})</span>
                    <span className="text-slate-400 text-[11px]">{s.examinationSession}</span>
                  </div>
                  {s.isCurrent ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 font-mono">
                      Current Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] text-slate-500 bg-slate-100">
                      Standard
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODALS & DIALOGS                                                      */}
      {/* ===================================================================== */}

      {/* 1. Create Student Modal */}
      {showCreateStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Authorized Student Record</h3>
              <button onClick={() => setShowCreateStudentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">PRN (Unique ID)*</label>
                <input
                  type="text"
                  required
                  value={studentForm.prn}
                  onChange={e => setStudentForm({ ...studentForm, prn: e.target.value })}
                  placeholder="e.g. 24UCO01099"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Student Full Name*</label>
                <input
                  type="text"
                  required
                  value={studentForm.name}
                  onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                  placeholder="e.g. PRATIK DEEPAK PATIL"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Mother's Name*</label>
                <input
                  type="text"
                  required
                  value={studentForm.motherName}
                  onChange={e => setStudentForm({ ...studentForm, motherName: e.target.value })}
                  placeholder="e.g. USHA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Seat Number*</label>
                <input
                  type="text"
                  required
                  value={studentForm.seatNo}
                  onChange={e => setStudentForm({ ...studentForm, seatNo: e.target.value })}
                  placeholder="e.g. SCOE24-C399"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Branch*</label>
                <select
                  value={studentForm.branch}
                  onChange={e => setStudentForm({ ...studentForm, branch: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Current Semester*</label>
                <select
                  value={studentForm.currentSemester}
                  onChange={e => setStudentForm({ ...studentForm, currentSemester: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Student Email</label>
                <input
                  type="email"
                  value={studentForm.email}
                  onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                  placeholder="pratik.patil@sanjivani.edu.in"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Initial Password*</label>
                <input
                  type="text"
                  required
                  value={studentForm.password}
                  onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateStudentModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  Authorize & Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Student Modal */}
      {showEditStudentModal && editStudentForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Student: {editStudentForm.prn}</h3>
              <button onClick={() => setShowEditStudentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={editStudentForm.name}
                  onChange={e => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Mother's Name</label>
                <input
                  type="text"
                  required
                  value={editStudentForm.motherName}
                  onChange={e => setEditStudentForm({ ...editStudentForm, motherName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Seat Number</label>
                <input
                  type="text"
                  required
                  value={editStudentForm.seatNo}
                  onChange={e => setEditStudentForm({ ...editStudentForm, seatNo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Roll Number</label>
                <input
                  type="text"
                  value={editStudentForm.rollNo}
                  onChange={e => setEditStudentForm({ ...editStudentForm, rollNo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Branch</label>
                <input
                  type="text"
                  value={editStudentForm.branch}
                  onChange={e => setEditStudentForm({ ...editStudentForm, branch: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Semester</label>
                <select
                  value={editStudentForm.currentSemester}
                  onChange={e => setEditStudentForm({ ...editStudentForm, currentSemester: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CSV Import Modal with Error Reporting */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Batch Student Enrollment (CSV Import)</h3>
                <p className="text-xs text-slate-500">Automated row validation with duplicate PRN detection</p>
              </div>
              <button onClick={() => { setShowCsvModal(false); setCsvReport(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Helper */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Expected CSV Header Format:</span>
              <code className="text-blue-900 font-mono text-[11px] block bg-white p-1.5 rounded border border-slate-200 overflow-x-auto">
                prn,name,mothername,seatno,rollno,branch,semester,password
              </code>
              <button
                type="button"
                onClick={() => {
                  setCsvContent(
`prn,name,mothername,seatno,rollno,branch,semester,password
24UCO01050,ROHAN SANTOSH JOSHI,SUNITA,SCOE24-C350,350,Computer Engineering,5,Student@123
24UCO01051,NEHA PRADEEP SHARMA,REKHA,SCOE24-C351,351,Computer Engineering,5,Student@123
24UIT02030,KARTIK ARUN KULKARNI,MANISHA,SCOE24-I130,130,Information Technology,5,Student@123`
                  );
                }}
                className="mt-2 text-xs font-bold text-blue-700 hover:underline cursor-pointer"
              >
                Load Sample CSV Rows Demo Data
              </button>
            </div>

            {/* Error Report if available */}
            {csvReport && (
              <div className="space-y-2">
                <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  csvReport.failedCount === 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-amber-50 text-amber-900 border border-amber-300'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Import Summary: {csvReport.importedCount} passed, {csvReport.failedCount} failed out of {csvReport.totalRows} rows.
                  </span>
                </div>

                {csvReport.errors && csvReport.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-red-200 bg-red-50 p-2.5 rounded-lg text-xs text-red-900 space-y-1">
                    <span className="font-bold block text-red-950">Validation Error Report:</span>
                    {csvReport.errors.map((err, idx) => (
                      <div key={idx} className="text-[11px] font-mono">
                        • Row {err.row} (PRN: {err.prn}): <strong>{err.reason}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleCsvImport} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Paste CSV Data Rows
              </label>
              <textarea
                rows={6}
                required
                value={csvContent}
                onChange={e => setCsvContent(e.target.value)}
                placeholder="Paste CSV rows here..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={csvLoading}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  {csvLoading ? 'Validating & Importing...' : 'Execute Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Deactivate Student Confirmation Dialog */}
      {confirmDeactivateStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Confirm Record Status Change
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to change the status of <strong>{confirmDeactivateStudent.name}</strong> (PRN: <span className="font-mono font-bold text-slate-800">{confirmDeactivateStudent.prn}</span>) to <strong>{confirmDeactivateStudent.status === 'Active' ? 'Inactive' : 'Active'}</strong>?
            </p>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-950 font-medium">
              Data Integrity Guarantee: Historical Statement of Grades, grade records, and audit logs are safely preserved.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeactivateStudent(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleStudentStatus(confirmDeactivateStudent)}
                className={`px-4 py-2 text-white font-bold text-xs rounded-lg cursor-pointer ${
                  confirmDeactivateStudent.status === 'Active' ? 'bg-red-700 hover:bg-red-800' : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Create Faculty Modal */}
      {showCreateFacultyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Authorized Faculty Account</h3>
              <button onClick={() => setShowCreateFacultyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFaculty} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Employee ID (Unique)*</label>
                <input
                  type="text"
                  required
                  value={facultyForm.employeeId}
                  onChange={e => setFacultyForm({ ...facultyForm, employeeId: e.target.value })}
                  placeholder="e.g. FAC-CS-120"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Full Name*</label>
                <input
                  type="text"
                  required
                  value={facultyForm.name}
                  onChange={e => setFacultyForm({ ...facultyForm, name: e.target.value })}
                  placeholder="e.g. Dr. S. K. Shinde"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Department*</label>
                <select
                  value={facultyForm.department}
                  onChange={e => setFacultyForm({ ...facultyForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Designation*</label>
                <select
                  value={facultyForm.designation}
                  onChange={e => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Head of Department">Head of Department</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Official Email*</label>
                <input
                  type="email"
                  required
                  value={facultyForm.email}
                  onChange={e => setFacultyForm({ ...facultyForm, email: e.target.value })}
                  placeholder="sk.shinde@sanjivani.edu.in"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Initial Password*</label>
                <input
                  type="text"
                  required
                  value={facultyForm.password}
                  onChange={e => setFacultyForm({ ...facultyForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateFacultyModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  Create Faculty Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Create Subject Modal */}
      {showCreateSubjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Course to Autonomous Catalog</h3>
              <button onClick={() => setShowCreateSubjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Course Code*</label>
                <input
                  type="text"
                  required
                  value={subjectForm.subjectCode}
                  onChange={e => setSubjectForm({ ...subjectForm, subjectCode: e.target.value })}
                  placeholder="e.g. CE601"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Course Name / Title*</label>
                <input
                  type="text"
                  required
                  value={subjectForm.subjectName}
                  onChange={e => setSubjectForm({ ...subjectForm, subjectName: e.target.value })}
                  placeholder="e.g. Distributed Computing Systems"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Course Type*</label>
                <select
                  value={subjectForm.subjectType}
                  onChange={e => setSubjectForm({ ...subjectForm, subjectType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                >
                  <option value="TH">Theory (TH)</option>
                  <option value="PR">Practical (PR)</option>
                  <option value="TW">Term Work (TW)</option>
                  <option value="OR">Oral / Viva (OR)</option>
                  <option value="PE">Professional Elective (PE)</option>
                  <option value="OE">Open Elective (OE)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Credits (1 - 10)*</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  value={subjectForm.credits}
                  onChange={e => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Semester (1 - 8)*</label>
                <select
                  value={subjectForm.semester}
                  onChange={e => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Department*</label>
                <select
                  value={subjectForm.department}
                  onChange={e => setSubjectForm({ ...subjectForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Max Internal Marks (0-100)*</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={subjectForm.maxInternalMarks}
                  onChange={e => setSubjectForm({ ...subjectForm, maxInternalMarks: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Max ESE Marks (0-100)*</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={subjectForm.maxEseMarks}
                  onChange={e => setSubjectForm({ ...subjectForm, maxEseMarks: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950 font-semibold flex items-center justify-between">
                <span>Calculated Total Examination Maximum:</span>
                <span className="font-mono text-sm font-black text-emerald-900">
                  {subjectForm.maxInternalMarks + subjectForm.maxEseMarks} Marks
                </span>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateSubjectModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  Register Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Faculty Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Assign Faculty to Course</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Select Faculty Member*</label>
                <select
                  required
                  value={assignmentForm.facultyId}
                  onChange={e => setAssignmentForm({ ...assignmentForm, facultyId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="">-- Choose Instructor --</option>
                  {facultyList.map(f => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.employeeId} - {f.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Select Course*</label>
                <select
                  required
                  value={assignmentForm.subjectId}
                  onChange={e => {
                    const selSub = subjects.find(s => s._id === e.target.value);
                    setAssignmentForm({
                      ...assignmentForm,
                      subjectId: e.target.value,
                      semester: selSub ? selSub.semester : assignmentForm.semester,
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.subjectCode} - {s.subjectName} (Sem {s.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Academic Year*</label>
                  <input
                    type="text"
                    required
                    value={assignmentForm.academicYear}
                    onChange={e => setAssignmentForm({ ...assignmentForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Division*</label>
                  <input
                    type="text"
                    required
                    value={assignmentForm.division}
                    onChange={e => setAssignmentForm({ ...assignmentForm, division: e.target.value.toUpperCase() })}
                    placeholder="e.g. A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  Authorize Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Academic Department</h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Department Code*</label>
                <input
                  type="text"
                  required
                  value={deptForm.code}
                  onChange={e => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ENTC"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Department Name*</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Electronics & Telecommunication"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">HOD Full Name</label>
                <input
                  type="text"
                  value={deptForm.hodName}
                  onChange={e => setDeptForm({ ...deptForm, hodName: e.target.value })}
                  placeholder="Dr. R. S. Patil"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Academic Session</h3>
              <button onClick={() => setShowSessionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Academic Year*</label>
                <input
                  type="text"
                  required
                  value={sessionForm.academicYear}
                  onChange={e => setSessionForm({ ...sessionForm, academicYear: e.target.value })}
                  placeholder="2024-2025"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Semester (1-8)*</label>
                <select
                  value={sessionForm.semester}
                  onChange={e => setSessionForm({
                    ...sessionForm,
                    semester: Number(e.target.value),
                    semesterLabel: `Semester ${e.target.value}`,
                    term: Number(e.target.value) % 2 !== 0 ? 'Odd' : 'Even',
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Term</label>
                <select
                  value={sessionForm.term}
                  onChange={e => setSessionForm({ ...sessionForm, term: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="Odd">Odd Term</option>
                  <option value="Even">Even Term</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Examination Title</label>
                <input
                  type="text"
                  value={sessionForm.examinationSession}
                  onChange={e => setSessionForm({ ...sessionForm, examinationSession: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
