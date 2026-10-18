import React, { useState, useEffect, useMemo } from 'react';
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
  Inbox,
  Save,
  Send,
  Lock,
  Unlock,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Award,
  ArrowRight,
  FileText,
  Sparkles,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function FacultyDashboard({ setCurrentView, setSelectedPrn }) {
  const { user } = useAuth();

  // State: Faculty assignments & selected course
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  
  // State: Selected course details & student roster
  const [courseData, setCourseData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // State: Marks inputs map { [prn]: { internalMarks, eseMarks, status, isDirty } }
  const [marksMap, setMarksMap] = useState({});

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, DRAFT, SUBMITTED, PENDING, ERROR
  const [showEmptySection, setShowEmptySection] = useState(false);

  // Notifications & UI state
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error' | 'info', message: '' }
  const [rowErrors, setRowErrors] = useState({}); // { [prn]: { internalMarks?: string, eseMarks?: string, general?: string } }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isReopening, setIsReopening] = useState(false);

  // 1. Fetch Assigned Courses on Mount
  useEffect(() => {
    fetchFacultyAssignments();
  }, [user]);

  const fetchFacultyAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const res = await fetch(`${API_BASE}/faculty/assignments`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAssignments(data.data || []);
        if (data.data?.length > 0) {
          // Default to first active assignment
          setSelectedAssignmentId(data.data[0]._id);
        }
      } else {
        // Fallback for non-logged in or mock preview
        console.warn('Assignments fetch failed, using fallback assignments:', data.message);
      }
    } catch (err) {
      console.warn('Network error loading faculty assignments:', err.message);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Find currently active assignment object
  const activeAssignment = useMemo(() => {
    return assignments.find((a) => a._id === selectedAssignmentId) || assignments[0] || null;
  }, [assignments, selectedAssignmentId]);

  // 2. Fetch Eligible Students Roster when active assignment changes
  useEffect(() => {
    if (activeAssignment && activeAssignment.subject?._id) {
      fetchCourseStudents(
        activeAssignment.subject._id,
        activeAssignment.academicYear,
        activeAssignment.semester,
        activeAssignment.division || 'A'
      );
    }
  }, [activeAssignment]);

  const fetchCourseStudents = async (subjectId, academicYear, semester, division) => {
    setLoadingStudents(true);
    setRowErrors({});
    try {
      const url = `${API_BASE}/faculty/courses/${subjectId}/students?academicYear=${encodeURIComponent(
        academicYear
      )}&semester=${semester}&division=${encodeURIComponent(division)}`;
      
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();

      if (res.ok && data.success) {
        setCourseData(data);
        const roster = data.students || [];
        setStudents(roster);

        // Initialize local editable marks inputs
        const initialMarks = {};
        roster.forEach((s) => {
          initialMarks[s.prn] = {
            internalMarks: s.internalMarks !== null && s.internalMarks !== undefined ? String(s.internalMarks) : '',
            eseMarks: s.eseMarks !== null && s.eseMarks !== undefined ? String(s.eseMarks) : '',
            status: s.status || 'Pending',
            isDirty: false,
          };
        });
        setMarksMap(initialMarks);
      } else {
        showNotification('error', data.message || 'Failed to load course student roster.');
      }
    } catch (err) {
      showNotification('error', `Connection error: ${err.message}`);
    } finally {
      setLoadingStudents(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // Handle Input Changes with Live Preview & Frontend Range Check
  const handleMarkChange = (prn, field, value) => {
    setMarksMap((prev) => {
      const current = prev[prn] || { internalMarks: '', eseMarks: '', status: 'Pending' };
      return {
        ...prev,
        [prn]: {
          ...current,
          [field]: value,
          isDirty: true,
        },
      };
    });

    // Clear row error for this field if corrected
    if (rowErrors[prn]?.[field]) {
      setRowErrors((prev) => {
        const studentErrors = { ...prev[prn] };
        delete studentErrors[field];
        if (Object.keys(studentErrors).length === 0) {
          const next = { ...prev };
          delete next[prn];
          return next;
        }
        return { ...prev, [prn]: studentErrors };
      });
    }
  };

  // Subject max bounds
  const maxInternal = courseData?.subject?.maxInternalMarks ?? 30;
  const maxEse = courseData?.subject?.maxEseMarks ?? 70;
  const totalMax = courseData?.subject?.totalMaxMarks ?? (maxInternal + maxEse);
  const isCourseLocked = courseData?.isLocked || courseData?.stats?.batchStatus === 'Submitted';

  // Compute validation state for a student row
  const getRowValidation = (student) => {
    const marks = marksMap[student.prn];
    if (!marks) return { status: 'Pending', label: 'Not Entered', color: 'text-slate-400 bg-slate-100' };

    const rawInt = marks.internalMarks;
    const rawEse = marks.eseMarks;

    const hasInt = rawInt !== '' && rawInt !== null && rawInt !== undefined;
    const hasEse = rawEse !== '' && rawEse !== null && rawEse !== undefined;

    const numInt = hasInt ? Number(rawInt) : null;
    const numEse = hasEse ? Number(rawEse) : null;

    // Check for range errors
    if (hasInt && (isNaN(numInt) || numInt < 0 || numInt > maxInternal)) {
      return {
        status: 'Error',
        label: numInt < 0 ? 'Negative Mark' : numInt > maxInternal ? `Exceeds ${maxInternal}` : 'Invalid Number',
        color: 'text-rose-700 bg-rose-50 border border-rose-200',
        errorField: 'internalMarks',
      };
    }

    if (hasEse && (isNaN(numEse) || numEse < 0 || numEse > maxEse)) {
      return {
        status: 'Error',
        label: numEse < 0 ? 'Negative Mark' : numEse > maxEse ? `Exceeds ${maxEse}` : 'Invalid Number',
        color: 'text-rose-700 bg-rose-50 border border-rose-200',
        errorField: 'eseMarks',
      };
    }

    if (marks.isDirty) {
      return {
        status: 'Unsaved',
        label: 'Unsaved Changes',
        color: 'text-amber-800 bg-amber-50 border border-amber-200',
      };
    }

    if (marks.status === 'Submitted') {
      return {
        status: 'Submitted',
        label: 'Submitted for Review',
        color: 'text-indigo-800 bg-indigo-50 border border-indigo-200',
      };
    }

    if (marks.status === 'Draft' || (hasInt && hasEse)) {
      return {
        status: 'Draft',
        label: 'Saved as Draft',
        color: 'text-blue-800 bg-blue-50 border border-blue-200',
      };
    }

    if (hasInt || hasEse) {
      return {
        status: 'Partial',
        label: 'Incomplete',
        color: 'text-slate-600 bg-slate-100 border border-slate-200',
      };
    }

    return {
      status: 'Pending',
      label: 'Pending Entry',
      color: 'text-slate-500 bg-slate-50 border border-slate-200',
    };
  };

  // Preview Total Calculation (Frontend preview only; official calculation computed on backend)
  const getPreviewTotal = (prn) => {
    const marks = marksMap[prn];
    if (!marks) return { total: '-', grade: '-' };

    const numInt = marks.internalMarks !== '' && !isNaN(marks.internalMarks) ? Number(marks.internalMarks) : null;
    const numEse = marks.eseMarks !== '' && !isNaN(marks.eseMarks) ? Number(marks.eseMarks) : null;

    if (numInt === null && numEse === null) return { total: '-', grade: '-' };

    const total = (numInt || 0) + (numEse || 0);

    // Approximate academic grade preview for 100 max
    let grade = 'F';
    const percentage = (total / totalMax) * 100;
    if (percentage >= 90) grade = 'O';
    else if (percentage >= 80) grade = 'A+';
    else if (percentage >= 70) grade = 'A';
    else if (percentage >= 60) grade = 'B+';
    else if (percentage >= 50) grade = 'B';
    else if (percentage >= 45) grade = 'C';
    else if (percentage >= 40) grade = 'P';

    return { total, grade, percentage: percentage.toFixed(1) };
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (!activeAssignment || !activeAssignment.subject) return;

    // Build payload of student marks
    const payloadMarks = students.map((s) => {
      const marks = marksMap[s.prn] || {};
      return {
        prn: s.prn,
        internalMarks: marks.internalMarks !== '' ? marks.internalMarks : null,
        eseMarks: marks.eseMarks !== '' ? marks.eseMarks : null,
      };
    });

    setIsSavingDraft(true);
    setRowErrors({});

    try {
      const res = await fetch(`${API_BASE}/faculty/marks/save-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subjectId: activeAssignment.subject._id,
          academicYear: activeAssignment.academicYear,
          semester: activeAssignment.semester,
          division: activeAssignment.division || 'A',
          marks: payloadMarks,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showNotification('success', data.message || 'Marks saved as draft successfully.');
        // Refresh roster from server to reflect calculated official totals
        fetchCourseStudents(
          activeAssignment.subject._id,
          activeAssignment.academicYear,
          activeAssignment.semester,
          activeAssignment.division || 'A'
        );
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          // Map row errors
          const errorMap = {};
          data.errors.forEach((err) => {
            if (err.prn) {
              if (!errorMap[err.prn]) errorMap[err.prn] = {};
              errorMap[err.prn][err.field || 'general'] = err.message;
            }
          });
          setRowErrors(errorMap);
          showNotification('error', `Validation failed: ${data.errors.length} issue(s) detected. Please see row-level errors.`);
        } else {
          showNotification('error', data.message || 'Failed to save marks as draft.');
        }
      }
    } catch (err) {
      showNotification('error', `Save draft failed: ${err.message}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Submit for Review
  const handleSubmitForReview = async () => {
    if (!activeAssignment || !activeAssignment.subject) return;

    // Check for any incomplete students before submitting
    const incomplete = [];
    const payloadMarks = [];

    students.forEach((s) => {
      const marks = marksMap[s.prn] || {};
      const intVal = marks.internalMarks;
      const eseVal = marks.eseMarks;

      if (intVal === '' || intVal === null || intVal === undefined || eseVal === '' || eseVal === null || eseVal === undefined) {
        incomplete.push(s.prn);
      }

      payloadMarks.push({
        prn: s.prn,
        internalMarks: intVal,
        eseMarks: eseVal,
      });
    });

    if (incomplete.length > 0) {
      showNotification(
        'error',
        `Cannot submit for review: ${incomplete.length} student(s) have missing internal or final examination marks. Complete all rows or use "Save as Draft".`
      );
      // Mark missing rows as error
      const errorMap = {};
      incomplete.forEach((prn) => {
        errorMap[prn] = { general: 'Both Internal and Final Exam marks are required before submission.' };
      });
      setRowErrors(errorMap);
      return;
    }

    if (!window.confirm('Are you sure you want to submit marks for review? Once submitted, marks are forwarded to the Controller of Examinations (COE) for moderation.')) {
      return;
    }

    setIsSubmitting(true);
    setRowErrors({});

    try {
      const res = await fetch(`${API_BASE}/faculty/marks/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subjectId: activeAssignment.subject._id,
          academicYear: activeAssignment.academicYear,
          semester: activeAssignment.semester,
          division: activeAssignment.division || 'A',
          marks: payloadMarks,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showNotification('success', data.message || 'Marks submitted for review successfully.');
        fetchCourseStudents(
          activeAssignment.subject._id,
          activeAssignment.academicYear,
          activeAssignment.semester,
          activeAssignment.division || 'A'
        );
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMap = {};
          data.errors.forEach((err) => {
            if (err.prn) {
              if (!errorMap[err.prn]) errorMap[err.prn] = {};
              errorMap[err.prn][err.field || 'general'] = err.message;
            }
          });
          setRowErrors(errorMap);
          showNotification('error', `Submission rejected: ${data.errors.length} error(s) found.`);
        } else {
          showNotification('error', data.message || 'Failed to submit marks for review.');
        }
      }
    } catch (err) {
      showNotification('error', `Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reopen Draft (for making corrections before COE final approval)
  const handleReopenDraft = async () => {
    if (!activeAssignment || !activeAssignment.subject) return;

    if (!window.confirm('Reopen marks draft? This will unlock the student roster and allow you to edit or correct mark entries.')) {
      return;
    }

    setIsReopening(true);
    try {
      const res = await fetch(`${API_BASE}/faculty/marks/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subjectId: activeAssignment.subject._id,
          academicYear: activeAssignment.academicYear,
          semester: activeAssignment.semester,
          division: activeAssignment.division || 'A',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('info', 'Marks draft reopened. You can now edit and save corrected marks.');
        fetchCourseStudents(
          activeAssignment.subject._id,
          activeAssignment.academicYear,
          activeAssignment.semester,
          activeAssignment.division || 'A'
        );
      } else {
        showNotification('error', data.message || 'Could not reopen draft.');
      }
    } catch (err) {
      showNotification('error', `Reopen request failed: ${err.message}`);
    } finally {
      setIsReopening(false);
    }
  };

  // Demo helper: Fill realistic sample marks
  const handleFillDemoMarks = () => {
    if (isCourseLocked) return;
    const sampleInternal = [27, 28, 25, 29, 26, 24, 28, 30, 25, 27, 26, 28];
    const sampleEse = [62, 65, 58, 67, 60, 54, 63, 68, 59, 61, 62, 66];

    setMarksMap((prev) => {
      const next = { ...prev };
      students.forEach((s, idx) => {
        next[s.prn] = {
          internalMarks: String(sampleInternal[idx % sampleInternal.length]),
          eseMarks: String(sampleEse[idx % sampleEse.length]),
          status: 'Draft',
          isDirty: true,
        };
      });
      return next;
    });
    setRowErrors({});
    showNotification('info', 'Populated sample marks. You can edit any value and click "Save as Draft" or "Submit for Review".');
  };

  // Filtered Students Roster
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(q) ||
        s.prn.toLowerCase().includes(q) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(q)) ||
        (s.seatNo && s.seatNo.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      const v = getRowValidation(s);
      if (statusFilter === 'DRAFT') return v.status === 'Draft' || v.status === 'Unsaved';
      if (statusFilter === 'SUBMITTED') return v.status === 'Submitted';
      if (statusFilter === 'PENDING') return v.status === 'Pending' || v.status === 'Partial';
      if (statusFilter === 'ERROR') return v.status === 'Error' || !!rowErrors[s.prn];
      return true;
    });
  }, [students, searchTerm, statusFilter, marksMap, rowErrors]);

  // Statistics metrics
  const stats = useMemo(() => {
    let draftCount = 0;
    let submittedCount = 0;
    let pendingCount = 0;
    let errorCount = Object.keys(rowErrors).length;

    students.forEach((s) => {
      const v = getRowValidation(s);
      if (v.status === 'Submitted') submittedCount++;
      else if (v.status === 'Draft' || v.status === 'Unsaved') draftCount++;
      else if (v.status === 'Error') errorCount++;
      else pendingCount++;
    });

    return {
      total: students.length,
      draftCount,
      submittedCount,
      pendingCount,
      errorCount,
    };
  }, [students, marksMap, rowErrors]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner: Faculty Identity */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0">
              <UserCheck className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-500/80 text-white px-2 py-0.5 rounded">
                  Faculty Evaluator
                </span>
                <span className="text-xs text-blue-200">
                  ID: {user?.employeeId || 'FAC-CS-108'}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Stage 4 Active
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                {user?.name || 'Prof. R. M. Kulkarni'}
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
                Department of Computer Engineering • Autonomous Scheme 2022
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmptySection(!showEmptySection)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {showEmptySection ? 'Show Normal View' : 'Preview Empty Course State'}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 shadow-sm border animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-500 hover:text-slate-700 font-bold ml-2 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Section */}
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
          {/* 1. ASSIGNED COURSES SELECTION (Workflow: Faculty sees only their assigned subjects) */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Assigned Teaching Allocations
                </h2>
                <p className="text-xs text-slate-500">
                  Faculty sees only subjects officially allocated by the Head of Department. Select a course to enter or audit student marks.
                </p>
              </div>
              <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-mono self-start sm:self-auto">
                Session: Winter 2024 (2024-2025)
              </span>
            </div>

            {loadingAssignments ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                Loading authorized course allocations...
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                No active course allocations assigned to your profile. Contact Department HOD or Examination Cell.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((assignment) => {
                  const sub = assignment.subject;
                  if (!sub) return null;
                  const isSelected = selectedAssignmentId === assignment._id;
                  const isSubmitted = assignment.statusBadge === 'Submitted';

                  return (
                    <div
                      key={assignment._id}
                      onClick={() => setSelectedAssignmentId(assignment._id)}
                      className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded">
                            {sub.subjectCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isSubmitted
                                ? 'bg-indigo-100 text-indigo-800'
                                : assignment.statusBadge === 'Draft'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isSubmitted ? (
                              <Lock className="w-2.5 h-2.5" />
                            ) : (
                              <Clock className="w-2.5 h-2.5" />
                            )}
                            {assignment.evaluationStatus || 'Active'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {sub.subjectName}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Type: <strong>{sub.subjectType}</strong> • {sub.credits} Credits • Sem {sub.semester} • Div {assignment.division || 'A'}
                        </p>
                        <div className="mt-2 text-[11px] text-slate-600 bg-slate-100/70 px-2 py-1 rounded inline-block">
                          Max: Internal <strong>{sub.maxInternalMarks}</strong> | Final <strong>{sub.maxEseMarks}</strong> | Total <strong>{sub.totalMaxMarks || (sub.maxInternalMarks + sub.maxEseMarks)}</strong>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <strong>{assignment.studentsEnrolled || 12}</strong> Eligible Students
                        </span>
                        <span className={`font-semibold text-[11px] flex items-center gap-0.5 ${isSelected ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                          {isSelected ? 'Currently Selected' : 'Select Course →'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. COURSE EVALUATION & MARKS ENTRY WORKFLOW CARD */}
          {activeAssignment && activeAssignment.subject && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs space-y-6 overflow-hidden">
              {/* Header Bar */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded">
                        {activeAssignment.subject.subjectCode}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        {activeAssignment.subject.subjectName}
                      </h2>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        Division {activeAssignment.division || 'A'}
                      </span>
                      {isCourseLocked ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Submitted for Review (Locked)
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Draft Entry Mode
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Academic Year: <strong>{activeAssignment.academicYear}</strong> • Semester: <strong>{activeAssignment.semester}</strong> • Scheme: Autonomous 2022 • Configured Marks: Internal (max {maxInternal}) + ESE (max {maxEse}) = {totalMax} Total
                    </p>
                  </div>

                  {/* Action Buttons: Save Draft, Submit for Review, Reopen */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Demo fast-fill */}
                    {!isCourseLocked && (
                      <button
                        type="button"
                        onClick={handleFillDemoMarks}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Fill sample demo marks for quick testing"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Fill Demo Marks
                      </button>
                    )}

                    {isCourseLocked ? (
                      <button
                        type="button"
                        onClick={handleReopenDraft}
                        disabled={isReopening}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        {isReopening ? 'Reopening...' : 'Reopen Draft for Corrections'}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          disabled={isSavingDraft || loadingStudents}
                          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5 text-blue-600" />
                          {isSavingDraft ? 'Saving Draft...' : 'Save as Draft'}
                        </button>

                        <button
                          type="button"
                          onClick={handleSubmitForReview}
                          disabled={isSubmitting || loadingStudents}
                          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5 text-blue-200" />
                          {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Batch Summary Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-medium text-slate-500">Total Enrolled</span>
                    <p className="text-lg font-bold text-slate-900">{stats.total}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-medium text-blue-600">Draft / Saved</span>
                    <p className="text-lg font-bold text-blue-800">{stats.draftCount}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-medium text-indigo-600">Submitted for Review</span>
                    <p className="text-lg font-bold text-indigo-800">{stats.submittedCount}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-medium text-amber-600">Pending Marks</span>
                    <p className="text-lg font-bold text-amber-800">{stats.pendingCount}</p>
                  </div>
                </div>
              </div>

              {/* Notice Banner: Saving marks does not auto-publish */}
              <div className="mx-6 p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Autonomous Examination Protocol:</span> Saving marks as draft or submitting for review forwards marks to the Controller of Examinations (COE) for auditing. Results are <strong>never published automatically</strong> until formal moderation and result declaration.
                </div>
              </div>

              {/* Row Level Error Banner (if any) */}
              {Object.keys(rowErrors).length > 0 && (
                <div className="mx-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs text-rose-900">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Row-Level Validation Errors ({Object.keys(rowErrors).length}):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700 pl-1">
                    {Object.entries(rowErrors).map(([prn, errs]) => (
                      <li key={prn}>
                        <strong>PRN {prn}:</strong> {Object.values(errs).join('; ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Roster Controls: Search & Filter Tabs */}
              <div className="px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by student name or PRN..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'ALL', label: `All (${students.length})` },
                    { id: 'DRAFT', label: `Draft (${stats.draftCount})` },
                    { id: 'SUBMITTED', label: `Submitted (${stats.submittedCount})` },
                    { id: 'PENDING', label: `Pending (${stats.pendingCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer text-xs whitespace-nowrap ${
                        statusFilter === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. MARKS TABLE (Roster Table) */}
              <div className="overflow-x-auto border-t border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Student PRN</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-3 text-center">Seat / Roll</th>
                      <th className="py-3 px-3 text-center min-w-[130px]">
                        Internal Marks
                        <span className="block text-[10px] font-normal text-slate-500 lowercase">
                          (Max {maxInternal})
                        </span>
                      </th>
                      <th className="py-3 px-3 text-center min-w-[130px]">
                        Final Exam (ESE)
                        <span className="block text-[10px] font-normal text-slate-500 lowercase">
                          (Max {maxEse})
                        </span>
                      </th>
                      <th className="py-3 px-3 text-center min-w-[110px]">
                        Total Marks
                        <span className="block text-[10px] font-normal text-slate-500 lowercase">
                          (Preview / {totalMax})
                        </span>
                      </th>
                      <th className="py-3 px-3 text-center">Validation Status</th>
                      <th className="py-3 px-4 text-right">Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingStudents ? (
                      <tr>
                        <td colSpan="9" className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                          Loading student evaluation roster...
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-12 text-center text-slate-400">
                          No students matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, idx) => {
                        const marks = marksMap[student.prn] || { internalMarks: '', eseMarks: '', status: 'Pending' };
                        const rowVal = getRowValidation(student);
                        const preview = getPreviewTotal(student.prn);
                        const hasRowError = !!rowErrors[student.prn];

                        return (
                          <tr
                            key={student.prn}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              hasRowError ? 'bg-rose-50/40' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-blue-950">
                              {student.prn}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              <div>{student.name}</div>
                              <div className="text-[10px] font-normal text-slate-400">
                                Div {student.division || 'A'} • Computer Engineering
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-slate-600 text-[11px]">
                              <div>{student.seatNo || 'SCOE-24'}</div>
                              <div className="text-[10px] text-slate-400">Roll: {student.rollNo || '-'}</div>
                            </td>

                            {/* Internal Marks Input */}
                            <td className="py-2.5 px-3 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max={maxInternal}
                                  step="1"
                                  disabled={isCourseLocked}
                                  value={marks.internalMarks}
                                  onChange={(e) => handleMarkChange(student.prn, 'internalMarks', e.target.value)}
                                  placeholder="0"
                                  className={`w-16 py-1 px-2 text-center font-mono font-bold text-xs rounded border transition-all focus:outline-none focus:ring-2 ${
                                    isCourseLocked
                                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                      : marks.internalMarks !== '' && (Number(marks.internalMarks) < 0 || Number(marks.internalMarks) > maxInternal)
                                      ? 'border-rose-500 bg-rose-50 text-rose-700 ring-rose-200'
                                      : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500 focus:border-blue-500'
                                  }`}
                                />
                                <span className="text-[11px] font-medium text-slate-400">/ {maxInternal}</span>
                              </div>
                              {marks.internalMarks !== '' && Number(marks.internalMarks) > maxInternal && (
                                <p className="text-[10px] text-rose-600 font-medium mt-0.5">Exceeds {maxInternal}</p>
                              )}
                              {marks.internalMarks !== '' && Number(marks.internalMarks) < 0 && (
                                <p className="text-[10px] text-rose-600 font-medium mt-0.5">Cannot be negative</p>
                              )}
                            </td>

                            {/* Final Examination (ESE) Marks Input */}
                            <td className="py-2.5 px-3 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max={maxEse}
                                  step="1"
                                  disabled={isCourseLocked}
                                  value={marks.eseMarks}
                                  onChange={(e) => handleMarkChange(student.prn, 'eseMarks', e.target.value)}
                                  placeholder="0"
                                  className={`w-16 py-1 px-2 text-center font-mono font-bold text-xs rounded border transition-all focus:outline-none focus:ring-2 ${
                                    isCourseLocked
                                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                      : marks.eseMarks !== '' && (Number(marks.eseMarks) < 0 || Number(marks.eseMarks) > maxEse)
                                      ? 'border-rose-500 bg-rose-50 text-rose-700 ring-rose-200'
                                      : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500 focus:border-blue-500'
                                  }`}
                                />
                                <span className="text-[11px] font-medium text-slate-400">/ {maxEse}</span>
                              </div>
                              {marks.eseMarks !== '' && Number(marks.eseMarks) > maxEse && (
                                <p className="text-[10px] text-rose-600 font-medium mt-0.5">Exceeds {maxEse}</p>
                              )}
                              {marks.eseMarks !== '' && Number(marks.eseMarks) < 0 && (
                                <p className="text-[10px] text-rose-600 font-medium mt-0.5">Cannot be negative</p>
                              )}
                            </td>

                            {/* Total Marks Preview */}
                            <td className="py-3 px-3 text-center">
                              <div className="font-mono font-extrabold text-xs text-slate-900">
                                {preview.total !== '-' ? `${preview.total} / ${totalMax}` : '—'}
                              </div>
                              {preview.grade !== '-' && (
                                <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                                  Grade: <span className="text-blue-700 font-bold">{preview.grade}</span> ({preview.percentage}%)
                                </div>
                              )}
                            </td>

                            {/* Validation Status Badge */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${rowVal.color}`}
                              >
                                {rowVal.status === 'Submitted' ? (
                                  <Lock className="w-2.5 h-2.5" />
                                ) : rowVal.status === 'Draft' ? (
                                  <Check className="w-2.5 h-2.5" />
                                ) : rowVal.status === 'Error' ? (
                                  <AlertCircle className="w-2.5 h-2.5" />
                                ) : (
                                  <Clock className="w-2.5 h-2.5" />
                                )}
                                {rowVal.label}
                              </span>
                            </td>

                            {/* Action: Preview Card */}
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedPrn(student.prn);
                                  setCurrentView('marksheet');
                                }}
                                className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                              >
                                Preview →
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
                <div>
                  Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> eligible student records for this course.
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span>Status: <strong>{activeAssignment.evaluationStatus || 'Active'}</strong></span>
                  <span>Attempt: <strong>Regular (1)</strong></span>
                  <span>Evaluator: <strong>{user?.name || 'Prof. R. M. Kulkarni'}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
