import express from 'express';
import { FacultyProfile } from '../models/FacultyProfile.js';
import { FacultyAssignment } from '../models/FacultyAssignment.js';
import { Subject } from '../models/Subject.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { CourseMark } from '../models/CourseMark.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Enforce authentication & Faculty-only role authorization for all faculty endpoints
router.use(authenticate, authorize('Faculty'));

/**
 * Helper: Find FacultyProfile for logged-in user
 */
async function getFacultyProfileForUser(userId, employeeId) {
  let profile = await FacultyProfile.findOne({ user: userId });
  if (!profile && employeeId) {
    profile = await FacultyProfile.findOne({ employeeId: employeeId.toUpperCase() });
  }
  return profile;
}

/**
 * Helper: Verify that logged-in faculty is assigned to the specified subject and term
 */
async function verifyFacultyCourseAssignment(facultyProfileId, subjectId, academicYear, semester, division) {
  const query = {
    faculty: facultyProfileId,
    subject: subjectId,
    status: 'Active',
  };

  if (academicYear) {
    query.academicYear = academicYear.trim();
  }

  if (semester !== undefined && semester !== null && semester !== '') {
    query.semester = Number(semester);
  }

  if (division && division !== 'All') {
    query.division = division.trim().toUpperCase();
  }

  const assignment = await FacultyAssignment.findOne(query);
  return assignment;
}

// ============================================================================
// 1. FACULTY PROFILE & ASSIGNED COURSES
// ============================================================================

/**
 * GET /api/faculty/profile
 * Returns the profile of the currently logged-in faculty member
 */
router.get('/profile', async (req, res) => {
  try {
    const profile = await getFacultyProfileForUser(req.user._id, req.user.employeeId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found for this account.',
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/faculty/assignments
 * Returns all active subject assignments for the logged-in faculty member
 * Includes statistics on enrolled students, drafts, and submissions
 */
router.get('/assignments', async (req, res) => {
  try {
    const profile = await getFacultyProfileForUser(req.user._id, req.user.employeeId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found. Please contact Administrator.',
      });
    }

    // Query assignments for this faculty
    const assignments = await FacultyAssignment.find({
      faculty: profile._id,
      status: 'Active',
    })
      .populate('subject')
      .sort({ academicYear: -1, semester: 1 })
      .lean();

    // Augment each assignment with evaluation progress metrics
    const enhancedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        if (!assignment.subject) return null;

        const subject = assignment.subject;
        const deptKeyword = subject.department.replace(/^Department\s+of\s+/i, '').trim();

        // Count eligible students matching department & semester
        const enrolledCount = await StudentProfile.countDocuments({
          $or: [
            { branch: { $regex: new RegExp(deptKeyword, 'i') } },
            { department: { $regex: new RegExp(deptKeyword, 'i') } },
          ],
          currentSemester: subject.semester,
          status: 'Active',
        });

        // Query existing marks entries
        const marksRecords = await CourseMark.find({
          subject: subject._id,
          academicYear: assignment.academicYear,
          semester: assignment.semester,
          division: assignment.division || 'A',
          attempt: 1,
        }).lean();

        const draftCount = marksRecords.filter((m) => m.status === 'Draft').length;
        const submittedCount = marksRecords.filter((m) => m.status === 'Submitted' || m.status === 'Approved').length;

        let evaluationStatus = 'Not Started';
        let statusBadge = 'Pending';

        if (submittedCount > 0 && submittedCount >= (enrolledCount || 1)) {
          evaluationStatus = 'Submitted for Review';
          statusBadge = 'Submitted';
        } else if (draftCount > 0 || submittedCount > 0) {
          evaluationStatus = `Draft in Progress (${draftCount + submittedCount}/${enrolledCount})`;
          statusBadge = 'Draft';
        }

        return {
          ...assignment,
          studentsEnrolled: enrolledCount,
          draftCount,
          submittedCount,
          evaluationStatus,
          statusBadge,
        };
      })
    );

    const validAssignments = enhancedAssignments.filter(Boolean);

    res.json({
      success: true,
      faculty: {
        id: profile._id,
        name: profile.name,
        employeeId: profile.employeeId,
        department: profile.department,
        designation: profile.designation,
      },
      count: validAssignments.length,
      data: validAssignments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 2. COURSE STUDENT ROSTER & MARKS INSPECTION
// ============================================================================

/**
 * GET /api/faculty/courses/:subjectId/students
 * Loads the eligible student roster and existing mark entries for an assigned subject
 * Protected: Checks faculty-subject assignment authorization
 */
router.get('/courses/:subjectId/students', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { academicYear, semester, division } = req.query;

    const profile = await getFacultyProfileForUser(req.user._id, req.user.employeeId);
    if (!profile) {
      return res.status(403).json({
        success: false,
        message: 'Faculty profile not found.',
      });
    }

    // 1. Verify subject exists
    const subject = await Subject.findById(subjectId).lean();
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found.',
      });
    }

    const targetYear = (academicYear || '2024-2025').trim();
    const targetSem = Number(semester || subject.semester);
    const targetDiv = (division || 'A').trim().toUpperCase();

    // 2. Authorization Rule: Prevent faculty from entering marks for unassigned subjects
    const assignment = await verifyFacultyCourseAssignment(
      profile._id,
      subjectId,
      targetYear,
      targetSem,
      targetDiv === 'ALL' ? null : targetDiv
    );

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You are not assigned to teach or evaluate ${subject.subjectCode} (${subject.subjectName}) for ${targetYear} Semester ${targetSem}.`,
      });
    }

    // 3. Find eligible students matching the subject's department/branch and semester
    const deptKeyword = subject.department.replace(/^Department\s+of\s+/i, '').trim();
    const studentQuery = {
      $or: [
        { branch: { $regex: new RegExp(deptKeyword, 'i') } },
        { department: { $regex: new RegExp(deptKeyword, 'i') } },
      ],
      currentSemester: targetSem,
      status: 'Active',
    };

    if (targetDiv && targetDiv !== 'ALL') {
      studentQuery.division = targetDiv;
    }

    const students = await StudentProfile.find(studentQuery)
      .sort({ rollNo: 1, prn: 1 })
      .lean();

    // 4. Load existing CourseMark entries for these students
    const existingMarks = await CourseMark.find({
      subject: subject._id,
      academicYear: targetYear,
      semester: targetSem,
      attempt: 1,
    }).lean();

    const marksMap = new Map();
    existingMarks.forEach((m) => {
      marksMap.set(m.prn.toUpperCase(), m);
    });

    // 5. Merge student profiles with existing marks
    let draftCount = 0;
    let submittedCount = 0;
    let approvedCount = 0;
    let returnedCount = 0;
    let publishedCount = 0;
    let pendingCount = 0;
    let batchReturnReason = null;

    const studentRoster = students.map((s) => {
      const existing = marksMap.get(s.prn.toUpperCase());
      const hasRecord = !!existing;

      const internalMarks = hasRecord ? existing.internalMarks : null;
      const eseMarks = hasRecord ? existing.eseMarks : null;
      const totalMarks = hasRecord ? existing.totalMarks : null;
      const status = hasRecord ? existing.status : 'Pending';

      if (status === 'Draft') draftCount++;
      else if (status === 'Submitted') submittedCount++;
      else if (status === 'Approved') approvedCount++;
      else if (status === 'Returned') {
        returnedCount++;
        if (existing.returnReason) batchReturnReason = existing.returnReason;
      } else if (status === 'Published') publishedCount++;
      else pendingCount++;

      return {
        studentId: s._id,
        prn: s.prn,
        name: s.name,
        rollNo: s.rollNo,
        seatNo: s.seatNo,
        division: s.division || 'A',
        internalMarks,
        eseMarks,
        totalMarks,
        maxInternal: subject.maxInternalMarks,
        maxEse: subject.maxEseMarks,
        totalMax: subject.totalMaxMarks || (subject.maxInternalMarks + subject.maxEseMarks),
        status,
        returnReason: existing?.returnReason || null,
        submittedAt: existing?.submittedAt || null,
        approvedAt: existing?.approvedAt || null,
        publishedAt: existing?.publishedAt || null,
        attempt: 1,
      };
    });

    let batchStatus = 'Not Started';
    if (publishedCount > 0 && publishedCount === studentRoster.length) {
      batchStatus = 'Published';
    } else if (approvedCount > 0 && approvedCount === studentRoster.length) {
      batchStatus = 'Approved';
    } else if (returnedCount > 0) {
      batchStatus = 'Returned';
    } else if (submittedCount > 0 && submittedCount === studentRoster.length) {
      batchStatus = 'Submitted';
    } else if (draftCount > 0 || submittedCount > 0) {
      batchStatus = 'Draft';
    }

    // Locked if Approved, Published, or Submitted without returns (faculty can edit if Draft or Returned)
    const isLocked =
      batchStatus === 'Published' ||
      batchStatus === 'Approved' ||
      (batchStatus === 'Submitted' && returnedCount === 0);

    res.json({
      success: true,
      subject: {
        _id: subject._id,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        subjectType: subject.subjectType,
        credits: subject.credits,
        semester: subject.semester,
        department: subject.department,
        maxInternalMarks: subject.maxInternalMarks,
        maxEseMarks: subject.maxEseMarks,
        totalMaxMarks: subject.totalMaxMarks || (subject.maxInternalMarks + subject.maxEseMarks),
      },
      assignment: {
        _id: assignment._id,
        academicYear: assignment.academicYear,
        semester: assignment.semester,
        division: assignment.division,
      },
      stats: {
        totalStudents: studentRoster.length,
        draftCount,
        submittedCount,
        approvedCount,
        returnedCount,
        publishedCount,
        pendingCount,
        batchStatus,
        returnReason: batchReturnReason,
      },
      isLocked,
      returnReason: batchReturnReason,
      students: studentRoster,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 3. MARKS ENTRY WORKFLOW (Save Draft, Reopen Draft, Submit for Review)
// ============================================================================

/**
 * Common validation function for marks array
 * @param {Array} marksList List of mark entries [{ prn, internalMarks, eseMarks }]
 * @param {Object} subject The subject definition with max limits
 * @param {Boolean} isFinalSubmission Whether validation is for final submission (strictly required non-empty)
 * @returns {Array} Array of validation error objects { row, prn, field, message }
 */
async function validateMarksArray(marksList, subject, isFinalSubmission = false) {
  const errors = [];
  const seenPrns = new Set();

  if (!Array.isArray(marksList) || marksList.length === 0) {
    errors.push({
      row: 0,
      field: 'marks',
      message: 'No student marks provided in request payload.',
    });
    return errors;
  }

  for (let idx = 0; idx < marksList.length; idx++) {
    const entry = marksList[idx];
    const rowNum = idx + 1;
    const prn = (entry.prn || entry.studentPrn || '').trim().toUpperCase();

    // 1. Validate PRN
    if (!prn) {
      errors.push({
        row: rowNum,
        field: 'prn',
        message: `Row ${rowNum}: Student PRN is missing.`,
      });
      continue;
    }

    if (seenPrns.has(prn)) {
      errors.push({
        row: rowNum,
        prn,
        field: 'prn',
        message: `Row ${rowNum}: Duplicate entry for student PRN ${prn} in the same submission batch.`,
      });
      continue;
    }
    seenPrns.add(prn);

    // 2. Validate Internal Marks
    const rawInternal = entry.internalMarks !== undefined ? entry.internalMarks : entry.internalMarksObtained;
    const hasInternal =
      rawInternal !== null &&
      rawInternal !== undefined &&
      rawInternal !== '';

    if (isFinalSubmission && !hasInternal) {
      errors.push({
        row: rowNum,
        prn,
        field: 'internalMarks',
        message: `Row ${rowNum} (${prn}): Internal marks are required before submitting for review.`,
      });
    } else if (hasInternal) {
      const numInternal = Number(rawInternal);
      if (isNaN(numInternal)) {
        errors.push({
          row: rowNum,
          prn,
          field: 'internalMarks',
          message: `Row ${rowNum} (${prn}): Internal mark must be a valid number.`,
        });
      } else if (numInternal < 0) {
        errors.push({
          row: rowNum,
          prn,
          field: 'internalMarks',
          message: `Row ${rowNum} (${prn}): Internal marks cannot be negative (${numInternal}).`,
        });
      } else if (numInternal > subject.maxInternalMarks) {
        errors.push({
          row: rowNum,
          prn,
          field: 'internalMarks',
          message: `Row ${rowNum} (${prn}): Internal marks (${numInternal}) exceed maximum allowed (${subject.maxInternalMarks}).`,
        });
      }
    }

    // 3. Validate Final Examination (ESE) Marks
    const rawEse = entry.eseMarks !== undefined ? entry.eseMarks : (entry.finalMarksObtained !== undefined ? entry.finalMarksObtained : entry.finalMarks);
    const hasEse =
      rawEse !== null &&
      rawEse !== undefined &&
      rawEse !== '';

    if (isFinalSubmission && !hasEse) {
      errors.push({
        row: rowNum,
        prn,
        field: 'eseMarks',
        message: `Row ${rowNum} (${prn}): Final examination marks are required before submitting for review.`,
      });
    } else if (hasEse) {
      const numEse = Number(rawEse);
      if (isNaN(numEse)) {
        errors.push({
          row: rowNum,
          prn,
          field: 'eseMarks',
          message: `Row ${rowNum} (${prn}): Final examination mark must be a valid number.`,
        });
      } else if (numEse < 0) {
        errors.push({
          row: rowNum,
          prn,
          field: 'eseMarks',
          message: `Row ${rowNum} (${prn}): Final examination marks cannot be negative (${numEse}).`,
        });
      } else if (numEse > subject.maxEseMarks) {
        errors.push({
          row: rowNum,
          prn,
          field: 'eseMarks',
          message: `Row ${rowNum} (${prn}): Final examination marks (${numEse}) exceed maximum allowed (${subject.maxEseMarks}).`,
        });
      }
    }
  }

  return errors;
}

/**
 * POST /api/faculty/marks/save-draft
 * Validates and saves marks entries as 'Draft'
 * Calculates official total marks on backend
 * Never publishes results automatically
 */
router.post('/marks/save-draft', async (req, res) => {
  try {
    const { subjectId, academicYear, semester, division } = req.body;
    const marks = req.body.marks || req.body.marksData || [];

    if (!subjectId || !academicYear || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: 'subjectId, academicYear, and semester are required.',
      });
    }

    const profile = await getFacultyProfileForUser(req.user._id, req.user.employeeId);
    if (!profile) {
      return res.status(403).json({
        success: false,
        message: 'Faculty profile not found.',
      });
    }

    // 1. Verify subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const cleanYear = academicYear.trim();
    const numSem = Number(semester);
    const cleanDiv = (division || 'A').trim().toUpperCase();

    // 2. Authorization check: Faculty must be assigned to this subject
    const assignment = await verifyFacultyCourseAssignment(
      profile._id,
      subjectId,
      cleanYear,
      numSem,
      cleanDiv === 'ALL' ? null : cleanDiv
    );

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to enter marks for this subject and term.',
      });
    }

    // Check if batch is already Approved or Published (must remain locked for faculty)
    const approvedOrPublished = await CourseMark.findOne({
      subject: subject._id,
      academicYear: cleanYear,
      semester: numSem,
      status: { $in: ['Approved', 'Published'] },
    });
    if (approvedOrPublished) {
      return res.status(403).json({
        success: false,
        message: `Cannot edit marks: This course evaluation batch has already been ${approvedOrPublished.status.toLowerCase()} by the Examination Cell.`,
      });
    }

    // 3. Validate entries (draft mode: allow partial/empty, but reject negative or exceeding max)
    const errors = await validateMarksArray(marks, subject, false);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed for one or more student mark entries.',
        errors,
      });
    }

    // 4. Process and upsert each entry
    const savedRecords = [];
    for (const entry of marks) {
      const prn = (entry.prn || entry.studentPrn || '').trim().toUpperCase();
      const student = await StudentProfile.findOne({ prn });
      if (!student) {
        continue; // Skip unrecognized PRNs or could report error
      }

      const rawInternal = entry.internalMarks !== undefined ? entry.internalMarks : entry.internalMarksObtained;
      const rawEse = entry.eseMarks !== undefined ? entry.eseMarks : (entry.finalMarksObtained !== undefined ? entry.finalMarksObtained : entry.finalMarks);

      const hasInternal =
        rawInternal !== null &&
        rawInternal !== undefined &&
        rawInternal !== '';
      const hasEse =
        rawEse !== null &&
        rawEse !== undefined &&
        rawEse !== '';

      const numInternal = hasInternal ? Number(rawInternal) : null;
      const numEse = hasEse ? Number(rawEse) : null;

      // Calculate official total on backend
      let officialTotal = null;
      if (numInternal !== null || numEse !== null) {
        officialTotal = (numInternal ?? 0) + (numEse ?? 0);
      }

      const attempt = Number(entry.attempt || 1);

      // Prevent duplicate mark records for same student, subject, and attempt: upsert unique compound key
      const record = await CourseMark.findOneAndUpdate(
        {
          student: student._id,
          subject: subject._id,
          academicYear: cleanYear,
          semester: numSem,
          attempt,
        },
        {
          $set: {
            prn: student.prn,
            studentName: student.name,
            rollNo: student.rollNo,
            seatNo: student.seatNo,
            courseCode: subject.subjectCode,
            faculty: profile._id,
            division: student.division || cleanDiv,
            internalMarks: numInternal,
            eseMarks: numEse,
            totalMarks: officialTotal,
            maxInternal: subject.maxInternalMarks,
            maxEse: subject.maxEseMarks,
            totalMax: subject.totalMaxMarks || (subject.maxInternalMarks + subject.maxEseMarks),
            status: 'Draft',
            evaluatedBy: profile.name,
            remarks: entry.remarks || '',
          },
        },
        { upsert: true, new: true, runValidators: true }
      );

      savedRecords.push(record);
    }

    res.json({
      success: true,
      message: `Successfully saved ${savedRecords.length} marks as draft.`,
      count: savedRecords.length,
      status: 'Draft',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/faculty/marks/submit
 * Validates complete marks and submits them for administrative / COE review
 * Strictly rejects missing, negative, or out-of-range marks
 * Official total calculated on backend
 * Never publishes results automatically
 */
router.post('/marks/submit', async (req, res) => {
  try {
    const { subjectId, academicYear, semester, division } = req.body;
    const marks = req.body.marks || req.body.marksData || [];

    if (!subjectId || !academicYear || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: 'subjectId, academicYear, and semester are required.',
      });
    }

    const profile = await getFacultyProfileForUser(req.user._id, req.user.employeeId);
    if (!profile) {
      return res.status(403).json({
        success: false,
        message: 'Faculty profile not found.',
      });
    }

    // 1. Verify subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const cleanYear = academicYear.trim();
    const numSem = Number(semester);
    const cleanDiv = (division || 'A').trim().toUpperCase();

    // 2. Authorization check: Faculty must be assigned to this subject
    const assignment = await verifyFacultyCourseAssignment(
      profile._id,
      subjectId,
      cleanYear,
      numSem,
      cleanDiv === 'ALL' ? null : cleanDiv
    );

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to enter marks for this subject and term.',
      });
    }

    // Check if batch is already Approved or Published (must remain locked for faculty)
    const approvedOrPublished = await CourseMark.findOne({
      subject: subject._id,
      academicYear: cleanYear,
      semester: numSem,
      status: { $in: ['Approved', 'Published'] },
    });
    if (approvedOrPublished) {
      return res.status(403).json({
        success: false,
        message: `Cannot submit marks: This course evaluation batch has already been ${approvedOrPublished.status.toLowerCase()} by the Examination Cell.`,
      });
    }

    // 3. Strict validation: Every entry must have non-empty valid numbers within allowed limits
    const errors = await validateMarksArray(marks, subject, true);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: All marks must be completed and within range before submission.',
        errors,
      });
    }

    // 4. Process and submit each mark entry
    const submittedRecords = [];
    const submissionTimestamp = new Date();

    for (const entry of marks) {
      const prn = (entry.prn || entry.studentPrn || '').trim().toUpperCase();
      const student = await StudentProfile.findOne({ prn });
      if (!student) {
        continue;
      }

      const rawInternal = entry.internalMarks !== undefined ? entry.internalMarks : entry.internalMarksObtained;
      const rawEse = entry.eseMarks !== undefined ? entry.eseMarks : (entry.finalMarksObtained !== undefined ? entry.finalMarksObtained : entry.finalMarks);

      const numInternal = Number(rawInternal);
      const numEse = Number(rawEse);
      // Official total calculated on backend
      const totalMarks = numInternal + numEse;
      const attempt = Number(entry.attempt || 1);

      const record = await CourseMark.findOneAndUpdate(
        {
          student: student._id,
          subject: subject._id,
          academicYear: cleanYear,
          semester: numSem,
          attempt,
        },
        {
          $set: {
            prn: student.prn,
            studentName: student.name,
            rollNo: student.rollNo,
            seatNo: student.seatNo,
            courseCode: subject.subjectCode,
            faculty: profile._id,
            division: student.division || cleanDiv,
            internalMarks: numInternal,
            eseMarks: numEse,
            totalMarks,
            maxInternal: subject.maxInternalMarks,
            maxEse: subject.maxEseMarks,
            totalMax: subject.totalMaxMarks || (subject.maxInternalMarks + subject.maxEseMarks),
            status: 'Submitted',
            submittedAt: submissionTimestamp,
            returnReason: null,
            returnedBy: null,
            returnedAt: null,
            evaluatedBy: profile.name,
            remarks: entry.remarks || '',
          },
        },
        { upsert: true, new: true, runValidators: true }
      );

      submittedRecords.push(record);
    }

    // Log audit trail for submission
    try {
      await AuditLog.create({
        action: 'SUBMITTED_FOR_REVIEW',
        entityType: 'CourseMark',
        entityId: subject._id,
        batchId: `${cleanYear}_SEM${numSem}_${subject.subjectCode}`,
        academicYear: cleanYear,
        semester: numSem,
        courseCode: subject.subjectCode,
        performedBy: req.user._id,
        performedByName: profile.name,
        performedByRole: 'Faculty',
        metadata: {
          count: submittedRecords.length,
          division: cleanDiv,
        },
      });
    } catch (auditErr) {
      console.warn('Failed to write AuditLog on submit:', auditErr.message);
    }

    res.json({
      success: true,
      message: `Successfully submitted ${submittedRecords.length} student marks for review. Results are pending COE verification.`,
      count: submittedRecords.length,
      status: 'Submitted',
      submittedAt: submissionTimestamp,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/faculty/marks/reopen
 * Allows faculty to reopen submitted marks as drafts to correct entries before COE lock
 */
router.post('/marks/reopen', async (req, res) => {
  try {
    const { subjectId, academicYear, semester, division } = req.body;

    if (!subjectId || !academicYear || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: 'subjectId, academicYear, and semester are required.',
      });
    }

    const profile = await getFacultyProfileForUser(req.user._id, req.user.employeeId);
    if (!profile) {
      return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
    }

    const cleanYear = academicYear.trim();
    const numSem = Number(semester);
    const cleanDiv = (division || 'A').trim().toUpperCase();

    // Verify assignment
    const assignment = await verifyFacultyCourseAssignment(
      profile._id,
      subjectId,
      cleanYear,
      numSem,
      cleanDiv === 'ALL' ? null : cleanDiv
    );

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to this subject.',
      });
    }

    // Verify batch is not Approved or Published
    const approvedOrPublished = await CourseMark.findOne({
      subject: subjectId,
      academicYear: cleanYear,
      semester: numSem,
      status: { $in: ['Approved', 'Published'] },
    });
    if (approvedOrPublished) {
      return res.status(403).json({
        success: false,
        message: `Cannot reopen marks: This batch has already been ${approvedOrPublished.status.toLowerCase()} by the Examination Cell.`,
      });
    }

    const filter = {
      subject: subjectId,
      academicYear: cleanYear,
      semester: numSem,
      attempt: 1,
      status: { $in: ['Submitted', 'Returned'] },
    };

    if (cleanDiv && cleanDiv !== 'ALL') {
      filter.division = cleanDiv;
    }

    const result = await CourseMark.updateMany(filter, {
      $set: { status: 'Draft' },
    });

    res.json({
      success: true,
      message: 'Marks draft reopened for corrections.',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
