import express from 'express';
import { GradingScheme, validateGradingSchemeRules } from '../models/GradingScheme.js';
import { ResultRecord } from '../models/ResultRecord.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Subject } from '../models/Subject.js';
import { CourseMark } from '../models/CourseMark.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getDefaultGradingScheme,
  calculateSemesterResult,
  evaluateSubjectScore,
  CONFIRMED_RULES,
  PROVISIONAL_RULES,
} from '../services/calculationEngine.js';

const router = express.Router();

// Enforce Admin authentication on all calculation and scheme management endpoints
router.use(authenticate, authorize('Admin'));

// ============================================================================
// 1. CONFIGURABLE GRADING SCHEMES
// ============================================================================

/**
 * GET /api/admin/grading-schemes
 * Lists all configured grading schemes, seeding the default scheme if none exist
 */
router.get('/grading-schemes', async (req, res) => {
  try {
    let schemes = await GradingScheme.find().sort({ createdAt: -1 }).lean();

    if (schemes.length === 0) {
      const defaultScheme = await GradingScheme.create(getDefaultGradingScheme());
      schemes = [defaultScheme.toObject()];
    }

    res.json({
      success: true,
      count: schemes.length,
      data: schemes,
      confirmedRules: CONFIRMED_RULES,
      provisionalRules: PROVISIONAL_RULES,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/admin/grading-schemes/active
 * Retrieves the currently active default grading scheme
 */
router.get('/grading-schemes/active', async (req, res) => {
  try {
    let activeScheme = await GradingScheme.findOne({ isDefault: true, status: 'Active' }).lean();

    if (!activeScheme) {
      activeScheme = await GradingScheme.findOne({ status: 'Active' }).lean();
    }

    if (!activeScheme) {
      const created = await GradingScheme.create(getDefaultGradingScheme());
      activeScheme = created.toObject();
    }

    res.json({
      success: true,
      data: activeScheme,
      confirmedRules: CONFIRMED_RULES,
      provisionalRules: PROVISIONAL_RULES,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/grading-schemes
 * Creates a new admin-configured grading scheme
 * Strictly validates boundaries for overlaps, gaps, and invalid mappings
 */
router.post('/grading-schemes', async (req, res) => {
  try {
    const {
      schemeName,
      schemeVersion,
      description,
      applicableYears,
      gradeRules,
      passingRequirements,
      subjectCreditRules,
      sgpaCalculationMethod,
      roundingConventions,
      isDefault,
    } = req.body;

    if (!schemeName || !schemeVersion) {
      return res.status(400).json({
        success: false,
        message: 'schemeName and schemeVersion are required.',
      });
    }

    // 1. Validate rules using validation engine
    const validation = validateGradingSchemeRules(gradeRules);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid grading configuration: ${validation.error}`,
      });
    }

    // 2. Check duplicate schemeVersion
    const existing = await GradingScheme.findOne({ schemeVersion: schemeVersion.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A grading scheme with version "${schemeVersion}" already exists.`,
      });
    }

    // 3. If new scheme is set as default, unset existing defaults
    if (isDefault) {
      await GradingScheme.updateMany({}, { $set: { isDefault: false } });
    }

    const scheme = await GradingScheme.create({
      schemeName: schemeName.trim(),
      schemeVersion: schemeVersion.trim(),
      description,
      applicableYears: applicableYears || ['2024-2025'],
      gradeRules,
      passingRequirements,
      subjectCreditRules,
      sgpaCalculationMethod,
      roundingConventions,
      isDefault: !!isDefault,
      status: 'Active',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Grading scheme "${scheme.schemeName}" (${scheme.schemeVersion}) created successfully.`,
      data: scheme,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/admin/grading-schemes/:id
 * Updates an existing grading scheme with boundary integrity checks
 */
router.put('/grading-schemes/:id', async (req, res) => {
  try {
    const { gradeRules, isDefault, ...otherUpdates } = req.body;

    // Validate boundaries if rules are updated
    if (gradeRules) {
      const validation = validateGradingSchemeRules(gradeRules);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: `Invalid grading configuration: ${validation.error}`,
        });
      }
      otherUpdates.gradeRules = gradeRules;
    }

    if (isDefault) {
      await GradingScheme.updateMany({ _id: { $ne: req.params.id } }, { $set: { isDefault: false } });
      otherUpdates.isDefault = true;
    }

    otherUpdates.updatedBy = req.user._id;

    const updated = await GradingScheme.findByIdAndUpdate(
      req.params.id,
      { $set: otherUpdates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Grading scheme not found.' });
    }

    res.json({
      success: true,
      message: 'Grading scheme updated successfully.',
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/admin/grading-schemes/:id/set-active
 * Sets a specific grading scheme as active default
 */
router.patch('/grading-schemes/:id/set-active', async (req, res) => {
  try {
    await GradingScheme.updateMany({}, { $set: { isDefault: false } });
    const updated = await GradingScheme.findByIdAndUpdate(
      req.params.id,
      { $set: { isDefault: true, status: 'Active', updatedBy: req.user._id } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Grading scheme not found.' });
    }

    res.json({
      success: true,
      message: `"${updated.schemeName}" is now the active default grading scheme.`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 2. AUTOMATIC RESULT CALCULATION ENGINE
// ============================================================================

/**
 * POST /api/admin/results/calculate-semester
 * Centralized result calculation engine for a semester cohort
 * - Iterates through enrolled students
 * - Collects submitted CourseMark records
 * - Detects missing marks and invalid academic records
 * - Evaluates official subject scores and SGPA
 * - Stores gradingSchemeVersion used
 * - Invariant: ResultRecord isPublished remains false (DO NOT PUBLISH YET)
 */
router.post('/results/calculate-semester', async (req, res) => {
  try {
    const { academicYear, semester, department, division, schemeId } = req.body;

    if (!academicYear || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: 'academicYear and semester are required.',
      });
    }

    const cleanYear = academicYear.trim();
    const numSem = Number(semester);

    // 1. Fetch Grading Scheme
    let scheme;
    if (schemeId) {
      scheme = await GradingScheme.findById(schemeId).lean();
    }
    if (!scheme) {
      scheme = await GradingScheme.findOne({ isDefault: true, status: 'Active' }).lean();
    }
    if (!scheme) {
      scheme = getDefaultGradingScheme();
    }

    // 2. Find curriculum subjects for this semester & department
    const subjectFilter = { semester: numSem };
    if (department && department !== 'ALL') {
      const deptKeyword = department.replace(/^Department\s+of\s+/i, '').trim();
      subjectFilter.department = { $regex: new RegExp(deptKeyword, 'i') };
    }

    const curriculumSubjects = await Subject.find(subjectFilter).sort({ subjectCode: 1 }).lean();
    if (curriculumSubjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No curriculum subjects found for Semester ${numSem} in the specified department.`,
      });
    }

    // 3. Find eligible active students
    const studentFilter = {
      currentSemester: numSem,
      status: 'Active',
    };

    if (department && department !== 'ALL') {
      const deptKeyword = department.replace(/^Department\s+of\s+/i, '').trim();
      studentFilter.$or = [
        { branch: { $regex: new RegExp(deptKeyword, 'i') } },
        { department: { $regex: new RegExp(deptKeyword, 'i') } },
      ];
    }

    if (division && division !== 'ALL') {
      studentFilter.division = division.trim().toUpperCase();
    }

    const students = await StudentProfile.find(studentFilter).sort({ rollNo: 1, prn: 1 }).lean();
    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active eligible students found for the selected academic cohort.',
      });
    }

    // 4. Run calculation engine for each student
    const processedResults = [];
    const missingMarksReport = [];

    for (const student of students) {
      const studentMissingCourses = [];
      const evaluatedScores = [];

      for (const subject of curriculumSubjects) {
        // Query evaluated mark from CourseMark
        const markRecord = await CourseMark.findOne({
          student: student._id,
          subject: subject._id,
          academicYear: cleanYear,
          semester: numSem,
          attempt: 1,
        }).lean();

        // Detect missing marks
        if (
          !markRecord ||
          markRecord.internalMarks === null ||
          markRecord.eseMarks === null ||
          markRecord.totalMarks === null
        ) {
          studentMissingCourses.push({
            subjectCode: subject.subjectCode,
            subjectName: subject.subjectName,
            status: markRecord ? markRecord.status : 'Not Entered',
          });
          continue;
        }

        try {
          // Authoritative evaluation for this course
          const evaluated = evaluateSubjectScore({
            subject,
            internalMarks: markRecord.internalMarks,
            eseMarks: markRecord.eseMarks,
            gradingScheme: scheme,
          });
          evaluatedScores.push(evaluated);
        } catch (evalErr) {
          studentMissingCourses.push({
            subjectCode: subject.subjectCode,
            error: evalErr.message,
          });
        }
      }

      // If any required course mark is missing or corrupt, do not create a corrupt result
      if (studentMissingCourses.length > 0) {
        missingMarksReport.push({
          prn: student.prn,
          name: student.name,
          missingCount: studentMissingCourses.length,
          missingCourses: studentMissingCourses,
        });
        continue;
      }

      // Calculate authoritative semester performance
      const semesterResult = calculateSemesterResult({
        student,
        subjectsScores: evaluatedScores,
        gradingScheme: scheme,
        academicYear: cleanYear,
        semester: numSem,
        attempt: 1,
        examinationName: `Winter ${cleanYear.split('-')[0]} Autonomous Examination`,
      });

      // Avoid duplicate results for the same student, semester and examination attempt: upsert
      const savedRecord = await ResultRecord.findOneAndUpdate(
        {
          prn: student.prn,
          academicYear: cleanYear,
          semester: numSem,
          attempt: 1,
        },
        {
          $set: {
            ...semesterResult,
            verifiedBy: req.user._id,
            isPublished: false, // Invariant: Calculations do NOT auto-publish
          },
        },
        { upsert: true, new: true, runValidators: true }
      );

      processedResults.push({
        prn: savedRecord.prn,
        studentName: savedRecord.studentName,
        totalCR: savedRecord.totalCR,
        totalEC: savedRecord.totalEC,
        totalGP: savedRecord.totalGP,
        sgpa: savedRecord.sgpa,
        percentage: savedRecord.percentage,
        resultStatus: savedRecord.resultStatus,
        gradingSchemeVersion: savedRecord.gradingSchemeVersion,
        isPublished: savedRecord.isPublished,
      });
    }

    res.json({
      success: true,
      message: `Calculated results for ${processedResults.length} student(s). ${missingMarksReport.length} student(s) skipped due to missing marks. Results remain unpublished in draft verification state.`,
      gradingScheme: {
        schemeName: scheme.schemeName,
        schemeVersion: scheme.schemeVersion,
        confirmedRules: CONFIRMED_RULES,
        provisionalRules: PROVISIONAL_RULES,
      },
      summary: {
        totalCohortSize: students.length,
        calculatedCount: processedResults.length,
        skippedCount: missingMarksReport.length,
        isPublished: false,
      },
      results: processedResults,
      missingMarksReport,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/results/recalculate/:prn
 * Recalculates dependent values after authorized marks corrections
 */
router.post('/results/recalculate/:prn', async (req, res) => {
  try {
    const { prn } = req.params;
    const { academicYear, semester, schemeId } = req.body;

    const student = await StudentProfile.findOne({ prn: prn.trim().toUpperCase() }).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const cleanYear = (academicYear || student.academicYear || '2024-2025').trim();
    const numSem = Number(semester || student.currentSemester || 5);

    // Fetch Grading Scheme
    let scheme;
    if (schemeId) {
      scheme = await GradingScheme.findById(schemeId).lean();
    }
    if (!scheme) {
      scheme = await GradingScheme.findOne({ isDefault: true, status: 'Active' }).lean();
    }
    if (!scheme) {
      scheme = getDefaultGradingScheme();
    }

    // Find courses for this student's semester & department
    const deptKeyword = student.branch.replace(/^Department\s+of\s+/i, '').trim();
    const subjects = await Subject.find({
      semester: numSem,
      department: { $regex: new RegExp(deptKeyword, 'i') },
    }).lean();

    if (subjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No curriculum subjects found for student branch and semester.',
      });
    }

    const evaluatedScores = [];
    const missingCourses = [];

    for (const subject of subjects) {
      const markRecord = await CourseMark.findOne({
        student: student._id,
        subject: subject._id,
        academicYear: cleanYear,
        semester: numSem,
        attempt: 1,
      }).lean();

      if (
        !markRecord ||
        markRecord.internalMarks === null ||
        markRecord.eseMarks === null ||
        markRecord.totalMarks === null
      ) {
        missingCourses.push(subject.subjectCode);
        continue;
      }

      const evaluated = evaluateSubjectScore({
        subject,
        internalMarks: markRecord.internalMarks,
        eseMarks: markRecord.eseMarks,
        gradingScheme: scheme,
      });
      evaluatedScores.push(evaluated);
    }

    if (missingCourses.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot recalculate result: Missing marks detected for courses: ${missingCourses.join(', ')}`,
      });
    }

    // Recalculate
    const calculated = calculateSemesterResult({
      student,
      subjectsScores: evaluatedScores,
      gradingScheme: scheme,
      academicYear: cleanYear,
      semester: numSem,
      attempt: 1,
    });

    // Update ResultRecord while maintaining unpublished state
    const updatedRecord = await ResultRecord.findOneAndUpdate(
      {
        prn: student.prn,
        academicYear: cleanYear,
        semester: numSem,
        attempt: 1,
      },
      {
        $set: {
          ...calculated,
          isPublished: false,
          verifiedBy: req.user._id,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: `Result successfully recalculated for student ${student.prn}. SGPA updated to ${updatedRecord.sgpa}.`,
      data: updatedRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/admin/results/inspect/:prn
 * Returns detailed calculated result record with grading scheme audit metadata
 */
router.get('/results/inspect/:prn', async (req, res) => {
  try {
    const { prn } = req.params;
    const { academicYear, semester } = req.query;

    const query = { prn: prn.trim().toUpperCase() };
    if (academicYear) query.academicYear = academicYear.trim();
    if (semester) query.semester = Number(semester);

    const record = await ResultRecord.findOne(query).sort({ semester: -1 }).lean();
    if (!record) {
      return res.status(404).json({ success: false, message: 'Calculated result record not found.' });
    }

    res.json({
      success: true,
      data: record,
      confirmedRules: CONFIRMED_RULES,
      provisionalRules: PROVISIONAL_RULES,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/admin/results/summary
 * Returns cohort statistical summary for a semester calculation batch
 */
router.get('/results/summary', async (req, res) => {
  try {
    const { academicYear, semester } = req.query;
    const cleanYear = (academicYear || '2024-2025').trim();
    const numSem = Number(semester || 5);

    const results = await ResultRecord.find({
      academicYear: cleanYear,
      semester: numSem,
    }).lean();

    let distinction = 0;
    let firstClass = 0;
    let secondClass = 0;
    let fail = 0;
    let sgpaSum = 0;

    results.forEach((r) => {
      sgpaSum += r.sgpa || 0;
      if (r.resultStatus?.includes('DISTINCTION')) distinction++;
      else if (r.resultStatus?.includes('FIRST CLASS')) firstClass++;
      else if (r.resultStatus?.includes('FAIL')) fail++;
      else secondClass++;
    });

    const total = results.length;
    const averageSgpa = total > 0 ? (sgpaSum / total).toFixed(2) : 0;

    res.json({
      success: true,
      academicYear: cleanYear,
      semester: numSem,
      totalCalculated: total,
      averageSgpa: Number(averageSgpa),
      distribution: {
        distinction,
        firstClass,
        secondClass,
        fail,
      },
      publicationState: 'Unpublished (Draft COE Verification Queue)',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
