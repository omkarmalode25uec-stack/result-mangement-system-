import express from 'express';
import { collegeInfo, sampleStudents, sampleMarksheets } from '../data/sampleData.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { ResultRecord } from '../models/ResultRecord.js';
import { Subject } from '../models/Subject.js';
import { AcademicSession } from '../models/AcademicSession.js';
import { FacultyAssignment } from '../models/FacultyAssignment.js';
import { authenticate, authorize, enforceStudentRecordAccess } from '../middleware/auth.js';

const router = express.Router();

// 1. Health Check (Public)
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Sanjivani College of Engineering - Result Management System (RMS)',
    stage: 'Stage 2: Authentication and Database',
    timestamp: new Date().toISOString(),
  });
});

// 2. College Information (Public)
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: collegeInfo,
  });
});

// 3. System Summary Statistics (Public / Authenticated)
router.get('/stats', async (req, res) => {
  try {
    let studentCount = 2450;
    let publishedCount = 1820;

    try {
      const dbStudentCount = await StudentProfile.countDocuments();
      if (dbStudentCount > 0) studentCount = dbStudentCount;

      const dbResultCount = await ResultRecord.countDocuments({ isPublished: true });
      if (dbResultCount > 0) publishedCount = dbResultCount;
    } catch (e) {}

    res.json({
      success: true,
      data: {
        totalRegisteredStudents: studentCount,
        activeSemesters: ['Semester III', 'Semester V', 'Semester VII'],
        resultsDeclaredCount: publishedCount,
        pendingEvaluationCount: 630,
        overallPassPercentage: 94.6,
        currentAcademicYear: '2024-2025',
        departments: [
          'Computer Engineering',
          'Information Technology',
          'Artificial Intelligence & Data Science',
          'Electronics & Computer Engineering',
          'Mechanical Engineering',
          'Civil Engineering',
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Subjects List (Protected: Any authenticated user)
router.get('/subjects', authenticate, async (req, res) => {
  try {
    const { semester, department } = req.query;
    const filter = {};
    if (semester) filter.semester = Number(semester);
    if (department) filter.department = department;

    const subjects = await Subject.find(filter).sort({ subjectCode: 1 }).lean();
    res.json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Academic Sessions (Protected: Any authenticated user)
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await AcademicSession.find().sort({ academicYear: -1, semester: 1 }).lean();
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Students list (Protected: Faculty and Admin can view all; Students can only view their own)
router.get('/students', authenticate, async (req, res) => {
  try {
    // If student, restrict to self
    if (req.user.role === 'Student') {
      const student = await StudentProfile.findOne({ prn: req.user.prn }).lean();
      return res.json({
        success: true,
        count: student ? 1 : 0,
        data: student ? [student] : [],
      });
    }

    // Faculty or Admin can search all students
    const { query, branch, semester } = req.query;
    const filter = {};

    if (branch) filter.branch = branch;
    if (semester) filter.currentSemester = Number(semester);

    let students = await StudentProfile.find(filter).lean();

    if (!students || students.length === 0) {
      students = sampleStudents;
    }

    if (query) {
      const q = query.toLowerCase();
      students = students.filter(
        (s) =>
          s.prn.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.branch.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Student details by PRN (Protected & Enforced: Students can only access their own PRN)
router.get(
  '/students/:prn',
  authenticate,
  enforceStudentRecordAccess,
  async (req, res) => {
    try {
      const prn = req.params.prn.toUpperCase();
      let student = await StudentProfile.findOne({ prn }).lean();

      if (!student) {
        student = sampleStudents.find((s) => s.prn === prn);
      }

      if (!student) {
        return res.status(404).json({
          success: false,
          message: `No student found with PRN: ${prn}`,
        });
      }

      res.json({
        success: true,
        data: student,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// 8. Statement of Grades / Marksheet preview by PRN
// Protected & Enforced: Students can ONLY access their own PUBLISHED results
router.get(
  '/marksheet/:prn',
  authenticate,
  enforceStudentRecordAccess,
  async (req, res) => {
    try {
      const prn = req.params.prn.toUpperCase();
      let marksheet = await ResultRecord.findOne({ prn }).sort({ createdAt: -1 }).lean();

      // Stage 6 Publication Rules:
      // 1. Draft results must never be visible to students.
      // 2. Submitted results must remain private.
      // 3. Approved results remain private until published.
      // 5. Students can access only their own published results.
      if (req.user.role === 'Student') {
        if (marksheet && !marksheet.isPublished) {
          return res.status(403).json({
            success: false,
            message: `Statement of Grades for PRN ${prn} is currently under moderation/review and has not been published yet.`,
            reviewStatus: marksheet.reviewStatus || 'Draft',
            isPublished: false,
          });
        }
      }

      if (!marksheet && req.user.role !== 'Student') {
        marksheet = sampleMarksheets[prn];
      }

      if (!marksheet || (req.user.role === 'Student' && !marksheet.isPublished)) {
        return res.status(404).json({
          success: false,
          message: `No published Statement of Grades found for PRN: ${prn}.`,
        });
      }

      res.json({
        success: true,
        college: collegeInfo,
        data: marksheet,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// 9. Dedicated route for logged-in student to get their own current marksheet
router.get('/marksheet-me', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Student' || !req.user.prn) {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is for authenticated students only.',
      });
    }

    const prn = req.user.prn.toUpperCase();
    let marksheet = await ResultRecord.findOne({ prn }).sort({ createdAt: -1 }).lean();

    // Stage 6 Publication Rules:
    // Block student from accessing unpublished, draft, submitted, or approved results
    if (marksheet && !marksheet.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Your examination results are currently under verification and have not been published yet.',
        reviewStatus: marksheet.reviewStatus || 'Draft',
        isPublished: false,
      });
    }

    if (!marksheet || !marksheet.isPublished) {
      return res.status(404).json({
        success: false,
        message: `No published Statement of Grades found for your PRN (${prn}).`,
      });
    }

    res.json({
      success: true,
      college: collegeInfo,
      data: marksheet,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 10. Public sample marksheet preview (for landing page showcase demonstration)
router.get('/public-preview/:prn', (req, res) => {
  const prn = req.params.prn.toUpperCase();
  const sample = sampleMarksheets[prn];

  if (!sample) {
    return res.status(404).json({
      success: false,
      message: `No public sample marksheet available for PRN: ${prn}. Available sample PRNs: 22UCO01042, 22UIT02015.`,
    });
  }

  res.json({
    success: true,
    college: collegeInfo,
    data: sample,
    isSamplePreview: true,
  });
});

export default router;
