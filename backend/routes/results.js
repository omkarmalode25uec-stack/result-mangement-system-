import express from 'express';
import { GradingScheme, validateGradingSchemeRules } from '../models/GradingScheme.js';
import { ResultRecord } from '../models/ResultRecord.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Subject } from '../models/Subject.js';
import { CourseMark } from '../models/CourseMark.js';
import { AuditLog } from '../models/AuditLog.js';
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
            reviewStatus: 'Draft',
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
          reviewStatus: 'Draft',
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

// ============================================================================
// 4. STAGE 6: RESULT REVIEW, MODERATION & PUBLICATION ENGINE
// ============================================================================

/**
 * GET /api/admin/results/batches
 * Lists course evaluation mark batches and semester calculated result batches
 * with review lifecycle status (Draft -> Submitted -> Approved -> Published)
 */
router.get('/results/batches', async (req, res) => {
  try {
    const { academicYear = '2024-2025', semester = 5 } = req.query;
    const cleanYear = academicYear.trim();
    const numSem = Number(semester);

    // 1. Course Mark Batches
    const subjects = await Subject.find({ semester: numSem }).sort({ subjectCode: 1 }).lean();

    const courseBatches = await Promise.all(
      subjects.map(async (subj) => {
        const marks = await CourseMark.find({
          subject: subj._id,
          academicYear: cleanYear,
          semester: numSem,
          attempt: 1,
        }).lean();

        const totalStudents = marks.length;
        let draftCount = 0;
        let submittedCount = 0;
        let approvedCount = 0;
        let returnedCount = 0;
        let publishedCount = 0;
        let returnReason = null;
        let submittedAt = null;
        let approvedAt = null;
        let publishedAt = null;

        marks.forEach((m) => {
          if (m.status === 'Draft') draftCount++;
          else if (m.status === 'Submitted') {
            submittedCount++;
            if (m.submittedAt) submittedAt = m.submittedAt;
          } else if (m.status === 'Approved') {
            approvedCount++;
            if (m.approvedAt) approvedAt = m.approvedAt;
          } else if (m.status === 'Returned') {
            returnedCount++;
            if (m.returnReason) returnReason = m.returnReason;
          } else if (m.status === 'Published') {
            publishedCount++;
            if (m.publishedAt) publishedAt = m.publishedAt;
          }
        });

        let batchStatus = 'Not Started';
        if (totalStudents > 0) {
          if (publishedCount === totalStudents) batchStatus = 'Published';
          else if (approvedCount === totalStudents) batchStatus = 'Approved';
          else if (returnedCount > 0) batchStatus = 'Returned';
          else if (submittedCount === totalStudents) batchStatus = 'Submitted';
          else if (draftCount > 0 || submittedCount > 0) batchStatus = 'Draft';
        }

        return {
          subjectId: subj._id,
          subjectCode: subj.subjectCode,
          subjectName: subj.subjectName,
          department: subj.department,
          credits: subj.credits,
          semester: subj.semester,
          academicYear: cleanYear,
          totalStudents,
          draftCount,
          submittedCount,
          approvedCount,
          returnedCount,
          publishedCount,
          batchStatus,
          returnReason,
          submittedAt,
          approvedAt,
          publishedAt,
        };
      })
    );

    // 2. Semester Result Batches (Cohort summaries)
    const resultRecords = await ResultRecord.find({
      academicYear: cleanYear,
      semester: numSem,
    }).lean();

    const branchMap = new Map();
    resultRecords.forEach((r) => {
      const branch = r.branch || 'General';
      if (!branchMap.has(branch)) {
        branchMap.set(branch, []);
      }
      branchMap.get(branch).push(r);
    });

    const semesterBatches = Array.from(branchMap.entries()).map(([branch, recs]) => {
      const totalCalculated = recs.length;
      let draftCount = 0;
      let submittedCount = 0;
      let approvedCount = 0;
      let returnedCount = 0;
      let publishedCount = 0;
      let returnReason = null;
      let approvedAt = null;
      let publishedAt = null;
      let sumSgpa = 0;
      let passCount = 0;
      let failCount = 0;

      recs.forEach((r) => {
        sumSgpa += r.sgpa || 0;
        if (r.resultStatus?.includes('FAIL')) failCount++;
        else passCount++;

        const st = r.reviewStatus || (r.isPublished ? 'Published' : 'Draft');
        if (st === 'Draft') draftCount++;
        else if (st === 'Submitted') submittedCount++;
        else if (st === 'Approved') {
          approvedCount++;
          if (r.approvedAt) approvedAt = r.approvedAt;
        } else if (st === 'Returned') {
          returnedCount++;
          if (r.returnReason) returnReason = r.returnReason;
        } else if (st === 'Published') {
          publishedCount++;
          if (r.publishedAt) publishedAt = r.publishedAt;
        }
      });

      let reviewStatus = 'Draft';
      if (publishedCount === totalCalculated && totalCalculated > 0) reviewStatus = 'Published';
      else if (approvedCount === totalCalculated && totalCalculated > 0) reviewStatus = 'Approved';
      else if (returnedCount > 0) reviewStatus = 'Returned';
      else if (submittedCount === totalCalculated && totalCalculated > 0) reviewStatus = 'Submitted';
      else if (approvedCount > 0) reviewStatus = 'Partially Approved';

      return {
        academicYear: cleanYear,
        semester: numSem,
        branch,
        totalCalculated,
        draftCount,
        submittedCount,
        approvedCount,
        returnedCount,
        publishedCount,
        reviewStatus,
        isPublished: publishedCount === totalCalculated && totalCalculated > 0,
        averageSgpa: totalCalculated > 0 ? Number((sumSgpa / totalCalculated).toFixed(2)) : 0,
        passCount,
        failCount,
        returnReason,
        approvedAt,
        publishedAt,
      };
    });

    res.json({
      success: true,
      academicYear: cleanYear,
      semester: numSem,
      courseBatches,
      semesterBatches,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/results/batches/approve
 * Approves a submitted course mark batch or a semester result batch
 */
router.post('/results/batches/approve', async (req, res) => {
  try {
    const { batchType = 'course', subjectId, academicYear, semester, branch } = req.body;

    if (!academicYear || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: 'academicYear and semester are required.',
      });
    }

    const cleanYear = academicYear.trim();
    const numSem = Number(semester);
    const approvedAt = new Date();

    if (batchType === 'course' || subjectId) {
      if (!subjectId) {
        return res.status(400).json({ success: false, message: 'subjectId is required for course batch approval.' });
      }

      const subject = await Subject.findById(subjectId).lean();
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found.' });
      }

      const marks = await CourseMark.find({
        subject: subjectId,
        academicYear: cleanYear,
        semester: numSem,
        attempt: 1,
      });

      if (marks.length === 0) {
        return res.status(404).json({ success: false, message: 'No student marks found for this course.' });
      }

      const unsubmitted = marks.filter((m) => m.status === 'Draft' || m.status === 'Returned');
      if (unsubmitted.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot approve batch: ${unsubmitted.length} student entries are still in Draft or Returned state and have not been submitted by faculty.`,
        });
      }

      const updateRes = await CourseMark.updateMany(
        {
          subject: subjectId,
          academicYear: cleanYear,
          semester: numSem,
          attempt: 1,
        },
        {
          $set: {
            status: 'Approved',
            approvedBy: req.user._id,
            approvedAt,
            returnReason: null,
          },
        }
      );

      // Immutable Audit Log
      await AuditLog.create({
        action: 'APPROVED',
        entityType: 'CourseMark',
        entityId: subjectId,
        batchId: `${cleanYear}_SEM${numSem}_${subject.subjectCode}`,
        academicYear: cleanYear,
        semester: numSem,
        courseCode: subject.subjectCode,
        performedBy: req.user._id,
        performedByName: req.user.name,
        performedByRole: 'Admin',
        metadata: { count: updateRes.modifiedCount },
      });

      return res.json({
        success: true,
        message: `Successfully approved course evaluation batch for ${subject.subjectCode} (${updateRes.modifiedCount} records).`,
        approvedCount: updateRes.modifiedCount,
        approvedAt,
      });
    }

    // Semester Batch Approval
    const query = { academicYear: cleanYear, semester: numSem };
    if (branch && branch !== 'ALL') {
      const deptKeyword = branch.replace(/^Department\s+of\s+/i, '').trim();
      query.branch = { $regex: new RegExp(deptKeyword, 'i') };
    }

    const results = await ResultRecord.find(query);
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'No result records found to approve.' });
    }

    const updateRes = await ResultRecord.updateMany(query, {
      $set: {
        reviewStatus: 'Approved',
        approvedBy: req.user._id,
        approvedAt,
        returnReason: null,
      },
    });

    await AuditLog.create({
      action: 'APPROVED',
      entityType: 'ResultBatch',
      batchId: `${cleanYear}_SEM${numSem}_${branch || 'ALL'}`,
      academicYear: cleanYear,
      semester: numSem,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: 'Admin',
      metadata: { count: updateRes.modifiedCount, branch: branch || 'ALL' },
    });

    res.json({
      success: true,
      message: `Successfully approved semester result batch (${updateRes.modifiedCount} student results).`,
      approvedCount: updateRes.modifiedCount,
      approvedAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/results/batches/return
 * Returns a batch to faculty with a mandatory recorded reason for corrections
 */
router.post('/results/batches/return', async (req, res) => {
  try {
    const { batchType = 'course', subjectId, academicYear, semester, branch, reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A specific return reason is strictly required before returning marks for correction.',
      });
    }

    if (!academicYear || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: 'academicYear and semester are required.',
      });
    }

    const cleanReason = reason.trim();
    const cleanYear = academicYear.trim();
    const numSem = Number(semester);
    const returnedAt = new Date();

    if (batchType === 'course' || subjectId) {
      if (!subjectId) {
        return res.status(400).json({ success: false, message: 'subjectId is required for returning course marks.' });
      }

      const subject = await Subject.findById(subjectId).lean();
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found.' });
      }

      const updateRes = await CourseMark.updateMany(
        {
          subject: subjectId,
          academicYear: cleanYear,
          semester: numSem,
          attempt: 1,
        },
        {
          $set: {
            status: 'Returned',
            returnReason: cleanReason,
            returnedBy: req.user._id,
            returnedAt,
          },
        }
      );

      await AuditLog.create({
        action: 'RETURNED_FOR_CORRECTION',
        entityType: 'CourseMark',
        entityId: subjectId,
        batchId: `${cleanYear}_SEM${numSem}_${subject.subjectCode}`,
        academicYear: cleanYear,
        semester: numSem,
        courseCode: subject.subjectCode,
        performedBy: req.user._id,
        performedByName: req.user.name,
        performedByRole: 'Admin',
        reason: cleanReason,
        metadata: { count: updateRes.modifiedCount },
      });

      return res.json({
        success: true,
        message: `Course evaluation batch returned to faculty for correction (${updateRes.modifiedCount} records).`,
        returnedCount: updateRes.modifiedCount,
        reason: cleanReason,
        returnedAt,
      });
    }

    // Semester Result Batch Return
    const query = { academicYear: cleanYear, semester: numSem };
    if (branch && branch !== 'ALL') {
      const deptKeyword = branch.replace(/^Department\s+of\s+/i, '').trim();
      query.branch = { $regex: new RegExp(deptKeyword, 'i') };
    }

    const updateRes = await ResultRecord.updateMany(query, {
      $set: {
        reviewStatus: 'Returned',
        returnReason: cleanReason,
        returnedBy: req.user._id,
        returnedAt,
      },
    });

    await AuditLog.create({
      action: 'RETURNED_FOR_CORRECTION',
      entityType: 'ResultBatch',
      batchId: `${cleanYear}_SEM${numSem}_${branch || 'ALL'}`,
      academicYear: cleanYear,
      semester: numSem,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: 'Admin',
      reason: cleanReason,
      metadata: { count: updateRes.modifiedCount },
    });

    res.json({
      success: true,
      message: `Semester result batch returned for correction (${updateRes.modifiedCount} records).`,
      returnedCount: updateRes.modifiedCount,
      reason: cleanReason,
      returnedAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/results/batches/publish
 * Publishes an approved result batch
 * Enforces rule: Draft or Returned results must NEVER be published directly
 */
router.post('/results/batches/publish', async (req, res) => {
  try {
    const { academicYear, semester, branch } = req.body;

    if (!academicYear || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: 'academicYear and semester are required.',
      });
    }

    const cleanYear = academicYear.trim();
    const numSem = Number(semester);

    const query = { academicYear: cleanYear, semester: numSem };
    if (branch && branch !== 'ALL') {
      const deptKeyword = branch.replace(/^Department\s+of\s+/i, '').trim();
      query.branch = { $regex: new RegExp(deptKeyword, 'i') };
    }

    const results = await ResultRecord.find(query);
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No result records found to publish for this cohort.',
      });
    }

    // Publication Rule: Must be Approved before publishing
    const unapproved = results.filter((r) => r.reviewStatus !== 'Approved');
    if (unapproved.length > 0) {
      const draftCount = unapproved.filter((r) => r.reviewStatus === 'Draft').length;
      const returnedCount = unapproved.filter((r) => r.reviewStatus === 'Returned').length;
      return res.status(400).json({
        success: false,
        message: `Cannot publish results: Batch must be formally Approved before publication. Found ${draftCount} Draft records and ${returnedCount} Returned records.`,
        unapprovedCount: unapproved.length,
      });
    }

    const publishedAt = new Date();
    const publishBatchId = `PUB_${cleanYear}_SEM${numSem}_${Date.now()}`;

    await ResultRecord.updateMany(query, {
      $set: {
        isPublished: true,
        reviewStatus: 'Published',
        publishedBy: req.user._id,
        publishedAt,
      },
    });

    // Also update CourseMark statuses to Published for students in this batch
    const studentIds = results.map((r) => r.student);
    await CourseMark.updateMany(
      {
        student: { $in: studentIds },
        academicYear: cleanYear,
        semester: numSem,
      },
      {
        $set: {
          status: 'Published',
          publishedAt,
        },
      }
    );

    // Immutable Audit Log
    await AuditLog.create({
      action: 'PUBLISHED',
      entityType: 'ResultBatch',
      batchId: publishBatchId,
      academicYear: cleanYear,
      semester: numSem,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: 'Admin',
      gradingSchemeVersion: results[0]?.gradingSchemeVersion || 'Autonomous Scheme 2022 v1',
      metadata: {
        publishedCount: results.length,
        branch: branch || 'ALL',
        publishedAt,
      },
    });

    res.json({
      success: true,
      message: `Successfully published ${results.length} student results. Statement of Grades is now accessible to students.`,
      publishedCount: results.length,
      publishedAt,
      publishBatchId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/results/batches/unpublish
 * Unpublishes a result batch with mandatory recorded justification
 */
router.post('/results/batches/unpublish', async (req, res) => {
  try {
    const { academicYear, semester, branch, reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory justification reason is required to unpublish results.',
      });
    }

    if (!academicYear || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: 'academicYear and semester are required.',
      });
    }

    const cleanReason = reason.trim();
    const cleanYear = academicYear.trim();
    const numSem = Number(semester);

    const query = { academicYear: cleanYear, semester: numSem };
    if (branch && branch !== 'ALL') {
      const deptKeyword = branch.replace(/^Department\s+of\s+/i, '').trim();
      query.branch = { $regex: new RegExp(deptKeyword, 'i') };
    }

    const results = await ResultRecord.find(query);
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found matching the specified cohort.',
      });
    }

    const targetStatus = req.body.targetStatus || 'Approved';
    await ResultRecord.updateMany(query, {
      $set: {
        isPublished: false,
        reviewStatus: targetStatus,
      },
    });

    const courseMarkTargetStatus = targetStatus === 'Draft' ? 'Draft' : 'Approved';
    await CourseMark.updateMany(
      {
        academicYear: cleanYear,
        semester: numSem,
      },
      {
        $set: {
          status: courseMarkTargetStatus,
        },
      }
    );

    await AuditLog.create({
      action: 'UNPUBLISHED',
      entityType: 'ResultBatch',
      batchId: `UNPUB_${cleanYear}_SEM${numSem}_${Date.now()}`,
      academicYear: cleanYear,
      semester: numSem,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: 'Admin',
      reason: cleanReason,
      metadata: { count: results.length, branch: branch || 'ALL' },
    });

    res.json({
      success: true,
      message: `Successfully unpublished ${results.length} student results. Access has been restricted.`,
      unpublishedCount: results.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/results/correct-published
 * Authorized post-publication mark correction
 * Requires admin authorization, mandatory recorded justification reason,
 * recalculates all dependent semester results, and records an immutable audit log
 */
router.post('/results/correct-published', async (req, res) => {
  try {
    const {
      prn,
      courseCode,
      academicYear,
      semester,
      internalMarks,
      eseMarks,
      reason,
    } = req.body;

    // 1. Mandatory Reason Check
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A justification reason is strictly required for post-publication corrections.',
      });
    }

    if (!prn || !courseCode || !academicYear || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: 'prn, courseCode, academicYear, and semester are required.',
      });
    }

    if (internalMarks === undefined || eseMarks === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Both internalMarks and eseMarks are required.',
      });
    }

    const cleanPrn = prn.trim().toUpperCase();
    const cleanCode = courseCode.trim().toUpperCase();
    const cleanYear = academicYear.trim();
    const numSem = Number(semester);
    const numInternal = Number(internalMarks);
    const numEse = Number(eseMarks);
    const cleanReason = reason.trim();

    // 2. Lookup student & subject
    const student = await StudentProfile.findOne({ prn: cleanPrn }).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const subject = await Subject.findOne({ subjectCode: cleanCode }).lean();
    if (!subject) {
      return res.status(404).json({ success: false, message: `Subject ${cleanCode} not found.` });
    }

    // 3. Mark range validation
    if (isNaN(numInternal) || numInternal < 0 || numInternal > subject.maxInternalMarks) {
      return res.status(400).json({
        success: false,
        message: `Internal marks must be a number between 0 and ${subject.maxInternalMarks}.`,
      });
    }

    if (isNaN(numEse) || numEse < 0 || numEse > subject.maxEseMarks) {
      return res.status(400).json({
        success: false,
        message: `ESE / Final examination marks must be a number between 0 and ${subject.maxEseMarks}.`,
      });
    }

    // 4. Find existing CourseMark
    const existingMark = await CourseMark.findOne({
      student: student._id,
      subject: subject._id,
      academicYear: cleanYear,
      semester: numSem,
      attempt: 1,
    });

    const previousMarks = existingMark
      ? {
          internalMarks: existingMark.internalMarks,
          eseMarks: existingMark.eseMarks,
          totalMarks: existingMark.totalMarks,
        }
      : null;

    const newTotal = numInternal + numEse;

    // Upsert / update CourseMark
    const updatedCourseMark = await CourseMark.findOneAndUpdate(
      {
        student: student._id,
        subject: subject._id,
        academicYear: cleanYear,
        semester: numSem,
        attempt: 1,
      },
      {
        $set: {
          prn: student.prn,
          studentName: student.name,
          courseCode: subject.subjectCode,
          internalMarks: numInternal,
          eseMarks: numEse,
          totalMarks: newTotal,
          maxInternal: subject.maxInternalMarks,
          maxEse: subject.maxEseMarks,
          totalMax: subject.totalMaxMarks || (subject.maxInternalMarks + subject.maxEseMarks),
          status: 'Published',
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    // 5. Lookup existing ResultRecord
    const existingResult = await ResultRecord.findOne({
      prn: cleanPrn,
      academicYear: cleanYear,
      semester: numSem,
    }).sort({ attempt: -1, createdAt: -1 });

    if (!existingResult) {
      return res.status(404).json({
        success: false,
        message: 'No existing semester result found for this student to correct.',
      });
    }

    const previousResultSummary = {
      sgpa: existingResult.sgpa,
      totalGP: existingResult.totalGP,
      totalEC: existingResult.totalEC,
      resultStatus: existingResult.resultStatus,
    };

    // 6. Recalculate authoritative semester result
    let scheme = await GradingScheme.findOne({
      schemeVersion: existingResult.gradingSchemeVersion,
    }).lean();
    if (!scheme) {
      scheme = await GradingScheme.findOne({ isDefault: true, status: 'Active' }).lean();
    }
    if (!scheme) {
      scheme = getDefaultGradingScheme();
    }

    // Calculate updated score for this subject
    const updatedSubjectScore = evaluateSubjectScore({
      subject,
      internalMarks: numInternal,
      eseMarks: numEse,
      gradingScheme: scheme,
    });

    let subjectMatched = false;
    const evaluatedScores = (existingResult.subjects || []).map((subDoc) => {
      const sObj = subDoc.toObject ? subDoc.toObject() : { ...subDoc };
      const isMatch =
        (sObj.subject && subject._id && sObj.subject.toString() === subject._id.toString()) ||
        (sObj.courseCode && subject.subjectCode && sObj.courseCode.toUpperCase() === subject.subjectCode.toUpperCase());

      if (isMatch) {
        subjectMatched = true;
        return updatedSubjectScore;
      }
      const totalMarks = sObj.totalMarks ?? Math.max(40, (sObj.gradePoints || 8) * 10 - 2);
      const internalMarks = sObj.internalMarks ?? Math.round(totalMarks * 0.3);
      const eseMarks = sObj.eseMarks ?? (totalMarks - internalMarks);
      return {
        ...sObj,
        internalMarks,
        eseMarks,
        totalMarks,
        totalMax: sObj.totalMax || 100,
        isPassing: sObj.earnedCredits > 0 && sObj.grade !== 'F',
        isConfirmedGradePoint: ['A+', 'A', 'B+'].includes(sObj.grade),
      };
    });

    if (!subjectMatched) {
      evaluatedScores.push(updatedSubjectScore);
    }

    const recalculated = calculateSemesterResult({
      student,
      subjectsScores: evaluatedScores,
      gradingScheme: scheme,
      academicYear: cleanYear,
      semester: numSem,
      attempt: 1,
    });

    // Update ResultRecord with recalculated values, preserving Published status
    existingResult.subjects = recalculated.subjects;
    existingResult.totalCR = recalculated.totalCR;
    existingResult.totalEC = recalculated.totalEC;
    existingResult.totalGP = recalculated.totalGP;
    existingResult.sgpa = recalculated.sgpa;
    existingResult.cgpa = recalculated.cgpa;
    existingResult.resultStatus = recalculated.resultStatus;
    existingResult.percentage = recalculated.percentage;
    existingResult.rulesStatus = recalculated.rulesStatus;
    existingResult.isPublished = true;
    existingResult.reviewStatus = 'Published';

    // Append to ResultRecord auditTrail
    existingResult.auditTrail.push({
      action: 'CORRECTED_POST_PUBLICATION',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: 'Admin',
      timestamp: new Date(),
      reason: cleanReason,
      gradingSchemeVersion: scheme.schemeVersion,
    });

    await existingResult.save();

    // 7. Record immutable AuditLog
    await AuditLog.create({
      action: 'CORRECTED_POST_PUBLICATION',
      entityType: 'ResultRecord',
      entityId: existingResult._id,
      batchId: `${cleanYear}_SEM${numSem}_${existingResult.branch}`,
      academicYear: cleanYear,
      semester: numSem,
      prn: student.prn,
      courseCode: subject.subjectCode,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: 'Admin',
      reason: cleanReason,
      gradingSchemeVersion: scheme.schemeVersion,
      previousState: {
        marks: previousMarks,
        result: previousResultSummary,
      },
      newState: {
        marks: {
          internalMarks: numInternal,
          eseMarks: numEse,
          totalMarks: newTotal,
        },
        result: {
          sgpa: existingResult.sgpa,
          totalGP: existingResult.totalGP,
          totalEC: existingResult.totalEC,
          resultStatus: existingResult.resultStatus,
        },
      },
    });

    res.json({
      success: true,
      message: `Successfully corrected marks for ${cleanCode} and recalculated dependent semester result.`,
      result: existingResult,
      correctedCourse: cleanCode,
      previousSGPA: previousResultSummary.sgpa,
      newSGPA: existingResult.sgpa,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/admin/results/audit-trail
 * Retrieves immutable audit trail logs
 */
router.get('/results/audit-trail', async (req, res) => {
  try {
    const { prn, batchId, academicYear, semester, action, limit = 100 } = req.query;

    const query = {};
    if (prn) query.prn = prn.trim().toUpperCase();
    if (batchId) query.batchId = batchId.trim();
    if (academicYear) query.academicYear = academicYear.trim();
    if (semester) query.semester = Number(semester);
    if (action) query.action = action.trim();

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
