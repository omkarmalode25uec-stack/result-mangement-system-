import express from 'express';
import { collegeInfo, sampleStudents, sampleMarksheets } from '../data/sampleData.js';
import { Student } from '../models/Student.js';
import { Marksheet } from '../models/Marksheet.js';

const router = express.Router();

// 1. Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Sanjivani College of Engineering - Result Management System (RMS)',
    stage: 'Stage 1: Project Setup and UI Foundation',
    timestamp: new Date().toISOString(),
  });
});

// 2. College Information
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: collegeInfo,
  });
});

// 3. Students list
router.get('/students', async (req, res) => {
  try {
    // If DB is connected and has records, prefer DB; otherwise fallback gracefully to sample data
    let students = [];
    try {
      students = await Student.find().lean();
    } catch (e) {
      // DB not connected or empty
    }

    if (!students || students.length === 0) {
      students = sampleStudents;
    }

    const { query } = req.query;
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

// 4. Student details by PRN
router.get('/students/:prn', async (req, res) => {
  const prn = req.params.prn.toUpperCase();
  let student = sampleStudents.find((s) => s.prn === prn);

  if (!student) {
    try {
      student = await Student.findOne({ prn }).lean();
    } catch (e) {}
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
});

// 5. Statement of Grades / Marksheet preview by PRN
router.get('/marksheet/:prn', async (req, res) => {
  const prn = req.params.prn.toUpperCase();
  let marksheet = sampleMarksheets[prn];

  if (!marksheet) {
    try {
      marksheet = await Marksheet.findOne({ prn }).lean();
    } catch (e) {}
  }

  if (!marksheet) {
    return res.status(404).json({
      success: false,
      message: `No Statement of Grades found for PRN: ${prn}. Available sample PRNs: 22UCO01042, 22UIT02015`,
    });
  }

  res.json({
    success: true,
    college: collegeInfo,
    data: marksheet,
  });
});

// 6. Summary Statistics for Dashboards
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalRegisteredStudents: 2450,
      activeSemesters: ['Semester III', 'Semester V', 'Semester VII'],
      resultsDeclaredCount: 1820,
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
});

export default router;
