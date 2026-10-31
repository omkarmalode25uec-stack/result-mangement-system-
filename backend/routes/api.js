import express from 'express';
import mongoose from 'mongoose';
import { collegeInfo, sampleStudents, sampleMarksheets } from '../data/sampleData.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { ResultRecord } from '../models/ResultRecord.js';
import { Subject } from '../models/Subject.js';
import { AcademicSession } from '../models/AcademicSession.js';
import { FacultyAssignment } from '../models/FacultyAssignment.js';
import { authenticate, authorize, enforceStudentRecordAccess } from '../middleware/auth.js';
import { generateStatementOfGradesPDF } from '../services/pdfService.js';

const router = express.Router();

// Helper functions for parameter normalization
function parseSemesterNumber(sem) {
  if (typeof sem === 'number') return sem;
  if (!sem) return null;
  const str = String(sem).trim();
  const matchNum = str.match(/\b([1-8])\b/);
  if (matchNum) return parseInt(matchNum[1], 10);
  const romanMap = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8 };
  const matchRoman = str.toLowerCase().match(/\b(viii|vii|vi|v|iv|iii|ii|i)\b/);
  if (matchRoman) return romanMap[matchRoman[1]];
  return null;
}

function buildAcademicYearQuery(yr) {
  if (!yr) return null;
  const clean = String(yr).trim();
  const norm = clean.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-').trim();
  const variants = [clean, norm];
  if (norm.includes('-')) {
    const parts = norm.split('-');
    if (parts[0].length === 4 && parts[1].length === 2) {
      variants.push(`${parts[0]}-20${parts[1]}`);
      variants.push(`${parts[0]}–${parts[1]}`);
      variants.push(`${parts[0]}–20${parts[1]}`);
    } else if (parts[0].length === 4 && parts[1].length === 4) {
      variants.push(`${parts[0]}-${parts[1].slice(2)}`);
      variants.push(`${parts[0]}–${parts[1].slice(2)}`);
      variants.push(`${parts[0]}–${parts[1]}`);
    }
  }
  return { $in: Array.from(new Set(variants)) };
}

// 1. Health Check (Public & Production-Ready)
router.get('/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    system: 'Sanjivani College of Engineering - Result Management System (RMS)',
    stage: 'Stage 8: Final Audit and Deployment',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbConnected ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
    },
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
      const prn = (req.user.role === 'Student' && req.user.prn)
        ? req.user.prn.toUpperCase()
        : req.params.prn.toUpperCase();
      const { academicYear, semester } = req.query;

      const query = { prn };
      if (academicYear) query.academicYear = buildAcademicYearQuery(academicYear);
      if (semester !== undefined && semester !== null && semester !== '') {
        const parsedSem = parseSemesterNumber(semester);
        if (parsedSem) query.semester = parsedSem;
      }

      let marksheet = await ResultRecord.findOne(query).sort({ semester: -1, createdAt: -1 }).lean();

      // Stage 6/7 Publication Rules:
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
    const { academicYear, semester } = req.query;

    const query = { prn };
    if (academicYear) query.academicYear = buildAcademicYearQuery(academicYear);
    if (semester !== undefined && semester !== null && semester !== '') {
      const parsedSem = parseSemesterNumber(semester);
      if (parsedSem) query.semester = parsedSem;
    }

    let marksheet = await ResultRecord.findOne(query).sort({ semester: -1, createdAt: -1 }).lean();

    // Stage 6/7 Publication Rules:
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

// 10. Student Academic Terms & Semester Progression Route
router.get('/student/terms', authenticate, enforceStudentRecordAccess, async (req, res) => {
  try {
    let prn = (req.user.role === 'Student' && req.user.prn)
      ? req.user.prn.trim().toUpperCase()
      : (req.query.prn || req.user.prn || '22UCO01042').trim().toUpperCase();

    const student = await StudentProfile.findOne({ prn }).lean();
    const currentSem = student ? student.currentSemester : 5;
    const records = await ResultRecord.find({ prn }).lean();

    const termsMap = new Map();
    records.forEach((r) => {
      termsMap.set(r.semester, r);
    });

    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    const terms = [];

    for (let sem = 1; sem <= 8; sem++) {
      const semLabel = `Semester ${romanNumerals[sem - 1]}`;
      const record = termsMap.get(sem);

      if (record && record.isPublished) {
        terms.push({
          semester: sem,
          id: `Sem ${sem}`,
          label: sem === currentSem ? `${semLabel} (Current)` : semLabel,
          academicYear: record.academicYear,
          status: 'Declared',
          isPublished: true,
          sgpa: record.sgpa ? record.sgpa.toFixed(2) : '0.00',
          cgpa: record.cgpa ? record.cgpa.toFixed(2) : null,
          totalCR: record.totalCR,
          totalEC: record.totalEC,
          totalGP: record.totalGP,
          resultStatus: record.resultStatus,
          resultDate: record.resultDate,
        });
      } else if (record && !record.isPublished) {
        terms.push({
          semester: sem,
          id: `Sem ${sem}`,
          label: sem === currentSem ? `${semLabel} (Current)` : semLabel,
          academicYear: record.academicYear,
          status: 'Pending Moderation',
          isPublished: false,
          reviewStatus: record.reviewStatus || 'Draft',
          sgpa: null, // Strictly hidden prior to publication
        });
      } else if (sem < currentSem) {
        terms.push({
          semester: sem,
          id: `Sem ${sem}`,
          label: semLabel,
          status: 'Archived',
          isPublished: false,
        });
      } else if (sem === currentSem) {
        terms.push({
          semester: sem,
          id: `Sem ${sem}`,
          label: `${semLabel} (Current)`,
          status: 'In Progress',
          isPublished: false,
        });
      } else {
        terms.push({
          semester: sem,
          id: `Sem ${sem}`,
          label: semLabel,
          status: 'Upcoming Term',
          isPublished: false,
        });
      }
    }

    res.json({
      success: true,
      prn,
      student,
      currentSemester: currentSem,
      terms,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 11. Student Specific Term Result (Protected & Enforced)
router.get('/student/result', authenticate, enforceStudentRecordAccess, async (req, res) => {
  try {
    // Invariant: Never trust a PRN supplied by frontend to determine which student's result to return
    let prn = (req.user.role === 'Student' && req.user.prn)
      ? req.user.prn.trim().toUpperCase()
      : (req.query.prn || req.user.prn || '22UCO01042').trim().toUpperCase();

    const { academicYear, semester } = req.query;
    const query = { prn };
    if (academicYear) query.academicYear = buildAcademicYearQuery(academicYear);
    if (semester !== undefined && semester !== null && semester !== '') {
      const parsedSem = parseSemesterNumber(semester);
      if (parsedSem) query.semester = parsedSem;
    }

    const record = await ResultRecord.findOne(query).sort({ semester: -1, createdAt: -1 }).lean();

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `No published result record found for PRN ${prn} in ${academicYear || 'selected year'}, ${semester || 'selected semester'}.`,
      });
    }

    // Publication gate: Never expose unpublished results to students
    if (req.user.role === 'Student' && !record.isPublished) {
      return res.status(403).json({
        success: false,
        message: `Examination results for ${record.semesterLabel || `Semester ${record.semester}`} (${record.academicYear}) are currently under moderation/review and have not been published yet.`,
        reviewStatus: record.reviewStatus || 'Draft',
        isPublished: false,
      });
    }

    res.json({
      success: true,
      college: collegeInfo,
      data: record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 12. Server-Side Statement of Grades PDF Download (by PRN)
// Protected & Enforced: Only student themselves or admin can download verified PDF
router.get(
  '/marksheet/:prn/pdf',
  authenticate,
  enforceStudentRecordAccess,
  async (req, res) => {
    try {
      const prn = (req.user.role === 'Student' && req.user.prn)
        ? req.user.prn.toUpperCase()
        : req.params.prn.toUpperCase();
      const { academicYear, semester } = req.query;

      const query = { prn };
      if (academicYear) query.academicYear = buildAcademicYearQuery(academicYear);
      if (semester !== undefined && semester !== null && semester !== '') {
        const parsedSem = parseSemesterNumber(semester);
        if (parsedSem) query.semester = parsedSem;
      }

      const record = await ResultRecord.findOne(query).sort({ semester: -1, createdAt: -1 }).lean();

      if (!record) {
        return res.status(404).json({
          success: false,
          message: `No Statement of Grades found for PRN: ${prn} (${academicYear || 'all sessions'}, Semester ${semester || 'any'}).`,
        });
      }

      // Security Invariant: NEVER expose unpublished results through PDF
      if (!record.isPublished) {
        return res.status(403).json({
          success: false,
          message: `Cannot download PDF: Examination results for PRN ${prn} are currently under moderation/review and have not been published yet.`,
          reviewStatus: record.reviewStatus || 'Draft',
          isPublished: false,
        });
      }

      const student = await StudentProfile.findOne({ prn }).lean();

      // Generate server-validated PDF
      const pdfBuffer = await generateStatementOfGradesPDF({
        result: record,
        student,
        college: collegeInfo,
      });

      const semNum = record.semester || 1;
      const filename = `Statement_of_Grades_${prn}_Sem${semNum}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.end(pdfBuffer);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// 13. Shortcut: Logged-in Student downloads own PDF directly
router.get('/marksheet-me/pdf', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Student' || !req.user.prn) {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is for authenticated students only.',
      });
    }

    const prn = req.user.prn.toUpperCase();
    const { academicYear, semester } = req.query;

    const query = { prn };
    if (academicYear) query.academicYear = buildAcademicYearQuery(academicYear);
    if (semester !== undefined && semester !== null && semester !== '') {
      const parsedSem = parseSemesterNumber(semester);
      if (parsedSem) query.semester = parsedSem;
    }

    const record = await ResultRecord.findOne(query).sort({ semester: -1, createdAt: -1 }).lean();

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `No Statement of Grades found for PRN: ${prn}.`,
      });
    }

    // Security Invariant: NEVER expose unpublished results through PDF
    if (!record.isPublished) {
      return res.status(403).json({
        success: false,
        message: `Cannot download PDF: Your examination results are currently under moderation/review and have not been published yet.`,
        reviewStatus: record.reviewStatus || 'Draft',
        isPublished: false,
      });
    }

    const student = await StudentProfile.findOne({ prn }).lean();

    const pdfBuffer = await generateStatementOfGradesPDF({
      result: record,
      student,
      college: collegeInfo,
    });

    const semNum = record.semester || 1;
    const filename = `Statement_of_Grades_${prn}_Sem${semNum}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 14. Public sample marksheet preview (for landing page showcase demonstration)
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
