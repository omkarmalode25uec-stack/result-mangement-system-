/**
 * STAGE 5 COMPREHENSIVE AUTOMATED TEST SUITE
 * Automatic Result Calculation Engine & Grading Scheme
 */

import {
  calculateSubjectTotal,
  determineGrade,
  roundNumber,
  evaluateSubjectScore,
  calculateSemesterResult,
  getDefaultGradingScheme,
  CONFIRMED_RULES,
  PROVISIONAL_RULES,
} from '../services/calculationEngine.js';

import { validateGradingSchemeRules } from '../models/GradingScheme.js';

const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

let passed = 0;
let failed = 0;

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${description} - ${details}`);
    failed++;
  }
}

async function runStage5Tests() {
  console.log('====================================================');
  console.log('RUNNING STAGE 5 AUTOMATIC RESULT CALCULATION TESTS');
  console.log('====================================================\n');

  // --------------------------------------------------------------------------
  // 1. TOTAL MARKS & PERCENTAGE UNIT TESTS
  // --------------------------------------------------------------------------
  console.log('1. Subject Total Marks & Percentage Calculation');
  
  // 1a. Standard calculation
  const totalRes = calculateSubjectTotal({
    internalMarks: 28,
    eseMarks: 62,
    maxInternal: 30,
    maxEse: 70,
    totalMax: 100,
  });
  assert('Total marks = internal (28) + ESE (62) = 90', totalRes.totalMarks === 90);
  assert('Calculates percentage correctly (90%)', totalRes.percentage === 90);

  // 1b. Maximum marks boundary (100 / 100)
  const maxBoundaryRes = calculateSubjectTotal({
    internalMarks: 30,
    eseMarks: 70,
    maxInternal: 30,
    maxEse: 70,
    totalMax: 100,
  });
  assert('Max marks boundary = 100 (100%)', maxBoundaryRes.totalMarks === 100 && maxBoundaryRes.percentage === 100);

  // 1c. Minimum marks boundary (0 / 100)
  const minBoundaryRes = calculateSubjectTotal({
    internalMarks: 0,
    eseMarks: 0,
    maxInternal: 30,
    maxEse: 70,
    totalMax: 100,
  });
  assert('Min marks boundary = 0 (0%)', minBoundaryRes.totalMarks === 0 && minBoundaryRes.percentage === 0);

  // 1d. Negative internal marks rejected
  let negIntError = false;
  try {
    calculateSubjectTotal({ internalMarks: -5, eseMarks: 50, maxInternal: 30, maxEse: 70 });
  } catch (err) {
    negIntError = true;
  }
  assert('Rejects negative internal marks', negIntError);

  // 1e. Negative ESE marks rejected
  let negEseError = false;
  try {
    calculateSubjectTotal({ internalMarks: 20, eseMarks: -10, maxInternal: 30, maxEse: 70 });
  } catch (err) {
    negEseError = true;
  }
  assert('Rejects negative ESE marks', negEseError);

  // 1f. Internal marks exceeding maximum rejected
  let exceedIntError = false;
  try {
    calculateSubjectTotal({ internalMarks: 35, eseMarks: 50, maxInternal: 30, maxEse: 70 });
  } catch (err) {
    exceedIntError = true;
  }
  assert('Rejects internal marks exceeding maxInternal (35 > 30)', exceedIntError);

  // 1g. ESE marks exceeding maximum rejected
  let exceedEseError = false;
  try {
    calculateSubjectTotal({ internalMarks: 25, eseMarks: 75, maxInternal: 30, maxEse: 70 });
  } catch (err) {
    exceedEseError = true;
  }
  assert('Rejects ESE marks exceeding maxEse (75 > 70)', exceedEseError);

  // --------------------------------------------------------------------------
  // 2. GRADE BOUNDARY & GRADE POINT MAPPINGS (CONFIRMED VS PROVISIONAL)
  // --------------------------------------------------------------------------
  console.log('\n2. Grade Boundaries & Confirmed vs Provisional Grade Points');
  const defaultScheme = getDefaultGradingScheme();

  // 90–100: O (Provisional GP = 10)
  const g95 = determineGrade(95, defaultScheme);
  assert('95% maps to Grade O', g95.grade === 'O');
  assert('Grade O has provisional GP 10', g95.gradePoints === 10 && g95.isConfirmed === false);

  const g90 = determineGrade(90, defaultScheme);
  assert('90% maps to Grade O (boundary)', g90.grade === 'O');

  // 80–89: A+ (Confirmed GP = 9)
  const g89 = determineGrade(89, defaultScheme);
  assert('89% maps to Grade A+', g89.grade === 'A+');
  assert('Grade A+ has CONFIRMED GP 9', g89.gradePoints === 9 && g89.isConfirmed === true);

  const g80 = determineGrade(80, defaultScheme);
  assert('80% maps to Grade A+ (boundary)', g80.grade === 'A+');

  // 70–79: A (Confirmed GP = 8)
  const g79 = determineGrade(79, defaultScheme);
  assert('79% maps to Grade A', g79.grade === 'A');
  assert('Grade A has CONFIRMED GP 8', g79.gradePoints === 8 && g79.isConfirmed === true);

  const g70 = determineGrade(70, defaultScheme);
  assert('70% maps to Grade A (boundary)', g70.grade === 'A');

  // 60–69: B+ (Confirmed GP = 7)
  const g69 = determineGrade(69, defaultScheme);
  assert('69% maps to Grade B+', g69.grade === 'B+');
  assert('Grade B+ has CONFIRMED GP 7', g69.gradePoints === 7 && g69.isConfirmed === true);

  const g60 = determineGrade(60, defaultScheme);
  assert('60% maps to Grade B+ (boundary)', g60.grade === 'B+');

  // 50–59: B (Provisional GP = 6)
  const g59 = determineGrade(59, defaultScheme);
  assert('59% maps to Grade B', g59.grade === 'B');
  assert('Grade B has provisional GP 6', g59.gradePoints === 6 && g59.isConfirmed === false);

  const g50 = determineGrade(50, defaultScheme);
  assert('50% maps to Grade B (boundary)', g50.grade === 'B');

  // 40–49: C (Provisional GP = 5)
  const g49 = determineGrade(49, defaultScheme);
  assert('49% maps to Grade C', g49.grade === 'C');
  assert('Grade C has provisional GP 5', g49.gradePoints === 5 && g49.isConfirmed === false);

  const g40 = determineGrade(40, defaultScheme);
  assert('40% maps to Grade C (passing boundary)', g40.grade === 'C' && g40.isPassing === true);

  // Below 40: F (Provisional GP = 0, Failing)
  const g39 = determineGrade(39, defaultScheme);
  assert('39% maps to Grade F (Failing)', g39.grade === 'F' && g39.isPassing === false);
  assert('Grade F has GP 0', g39.gradePoints === 0);

  const g0 = determineGrade(0, defaultScheme);
  assert('0% maps to Grade F', g0.grade === 'F' && g0.gradePoints === 0);

  // --------------------------------------------------------------------------
  // 3. CONFIGURABLE SCHEME VALIDATION (OVERLAPS, GAPS, INTEGRITY)
  // --------------------------------------------------------------------------
  console.log('\n3. Grading Scheme Boundary Validation Engine');

  // 3a. Valid scheme
  const validCheck = validateGradingSchemeRules(defaultScheme.gradeRules);
  assert('Default scheme is recognized as valid', validCheck.isValid === true);

  // 3b. Overlapping boundaries rejected
  const overlappingRules = [
    { grade: 'O', gradePoints: 10, minPercentage: 85, maxPercentage: 100, isPassing: true },
    { grade: 'A+', gradePoints: 9, minPercentage: 80, maxPercentage: 90, isPassing: true }, // overlaps 85-90!
    { grade: 'F', gradePoints: 0, minPercentage: 0, maxPercentage: 79.99, isPassing: false },
  ];
  const overlapCheck = validateGradingSchemeRules(overlappingRules);
  assert('Rejects overlapping boundaries', overlapCheck.isValid === false);
  assert('Reports overlap error message', overlapCheck.error?.includes('Overlapping'));

  // 3c. Incomplete boundaries (gap detected) rejected
  const gapRules = [
    { grade: 'A', gradePoints: 10, minPercentage: 70, maxPercentage: 100, isPassing: true },
    { grade: 'F', gradePoints: 0, minPercentage: 0, maxPercentage: 50, isPassing: false }, // gap 51-69 unhandled!
  ];
  const gapCheck = validateGradingSchemeRules(gapRules);
  assert('Rejects unhandled gaps in grading scale', gapCheck.isValid === false);
  assert('Reports gap error message', gapCheck.error?.includes('gap'));

  // 3d. Missing lower bound (starts above 0) rejected
  const noBottomRules = [
    { grade: 'A', gradePoints: 10, minPercentage: 40, maxPercentage: 100, isPassing: true },
    { grade: 'F', gradePoints: 0, minPercentage: 10, maxPercentage: 39.99, isPassing: false }, // doesn't cover 0-9!
  ];
  const noBottomCheck = validateGradingSchemeRules(noBottomRules);
  assert('Rejects scheme that does not start at 0%', noBottomCheck.isValid === false);

  // 3e. Inverted min > max rejected
  const invertedRules = [
    { grade: 'A', gradePoints: 10, minPercentage: 90, maxPercentage: 70, isPassing: true },
    { grade: 'F', gradePoints: 0, minPercentage: 0, maxPercentage: 69.99, isPassing: false },
  ];
  const invertedCheck = validateGradingSchemeRules(invertedRules);
  assert('Rejects inverted range (min > max)', invertedCheck.isValid === false);

  // --------------------------------------------------------------------------
  // 4. ROUNDING CONVENTIONS
  // --------------------------------------------------------------------------
  console.log('\n4. Rounding Conventions Support');
  // Half-up rounding
  assert('Round Half-Up: 8.714 -> 8.71', roundNumber(8.7142857, 2, 'HALF_UP') === 8.71);
  assert('Round Half-Up: 8.715 -> 8.72', roundNumber(8.715, 2, 'HALF_UP') === 8.72);
  assert('Round Half-Up: 9.999 -> 10', roundNumber(9.999, 2, 'HALF_UP') === 10);
  // Truncate mode
  assert('Round Truncate: 8.719 -> 8.71', roundNumber(8.719, 2, 'TRUNCATE') === 8.71);

  // --------------------------------------------------------------------------
  // 5. CREDITS, GRADE POINTS, & CREDIT POINTS CALCULATION
  // --------------------------------------------------------------------------
  console.log('\n5. Credits & Weighted Grade Points Calculation');
  const dummySubject3Cr = {
    _id: 'sub-3cr',
    subjectCode: 'CE501',
    subjectName: 'Database Management Systems',
    subjectType: 'TH',
    credits: 3,
    maxInternalMarks: 30,
    maxEseMarks: 70,
    totalMaxMarks: 100,
  };

  // Student scores 28 + 62 = 90% -> Grade O (GP = 10)
  const evalO = evaluateSubjectScore({
    subject: dummySubject3Cr,
    internalMarks: 28,
    eseMarks: 62,
    gradingScheme: defaultScheme,
  });
  assert('Course credits = 3', evalO.credits === 3);
  assert('Earned credits = 3 (passed)', evalO.earnedCredits === 3);
  assert('Grade Points = 10', evalO.gradePoints === 10);
  assert('Credit Points = 3 * 10 = 30', evalO.creditPoints === 30);

  // Student scores failing marks (10 + 20 = 30%) -> Grade F (GP = 0)
  const evalF = evaluateSubjectScore({
    subject: dummySubject3Cr,
    internalMarks: 10,
    eseMarks: 20,
    gradingScheme: defaultScheme,
  });
  assert('Failing Grade F: Earned credits = 0', evalF.earnedCredits === 0);
  assert('Failing Grade F: Grade Points = 0', evalF.gradePoints === 0);
  assert('Failing Grade F: Credit Points = 0', evalF.creditPoints === 0);

  // --------------------------------------------------------------------------
  // 6. FULL SGPA CALCULATION (MATHEMATICAL VERIFICATION AGAINST AARAV SHINDE MARKSHEET)
  // --------------------------------------------------------------------------
  console.log('\n6. Full SGPA & Semester Performance Verification (Exact Reference Marksheet)');
  // 9 courses from Sanjivani Statement of Grades:
  // CE501: 3 Cr, Grade A+ (GP 9) -> CP 27
  // CE502: 3 Cr, Grade A  (GP 8) -> CP 24
  // CE503: 3 Cr, Grade B+ (GP 7) -> CP 21
  // CE504: 3 Cr, Grade O  (GP 10)-> CP 30
  // CE505: 3 Cr, Grade A  (GP 8) -> CP 24
  // CE506: 2 Cr, Grade O  (GP 10)-> CP 20
  // CE507: 1 Cr, Grade A+ (GP 9) -> CP 9
  // CE508: 2 Cr, Grade O  (GP 10)-> CP 20
  // CE509: 1 Cr, Grade A  (GP 8) -> CP 8
  // Total CR = 21, Total EC = 21, Total GP = 183
  // SGPA = 183 / 21 = 8.7142857 -> 8.71
  const referenceSubjectScores = [
    { courseCode: 'CE501', credits: 3, earnedCredits: 3, grade: 'A+', gradePoints: 9, creditPoints: 27, internalMarks: 27, eseMarks: 58, totalMarks: 85, isPassing: true, isConfirmedGradePoint: true },
    { courseCode: 'CE502', credits: 3, earnedCredits: 3, grade: 'A', gradePoints: 8, creditPoints: 24, internalMarks: 24, eseMarks: 52, totalMarks: 76, isPassing: true, isConfirmedGradePoint: true },
    { courseCode: 'CE503', credits: 3, earnedCredits: 3, grade: 'B+', gradePoints: 7, creditPoints: 21, internalMarks: 22, eseMarks: 45, totalMarks: 67, isPassing: true, isConfirmedGradePoint: true },
    { courseCode: 'CE504', credits: 3, earnedCredits: 3, grade: 'O', gradePoints: 10, creditPoints: 30, internalMarks: 28, eseMarks: 65, totalMarks: 93, isPassing: true, isConfirmedGradePoint: false },
    { courseCode: 'CE505', credits: 3, earnedCredits: 3, grade: 'A', gradePoints: 8, creditPoints: 24, internalMarks: 25, eseMarks: 53, totalMarks: 78, isPassing: true, isConfirmedGradePoint: true },
    { courseCode: 'CE506', credits: 2, earnedCredits: 2, grade: 'O', gradePoints: 10, creditPoints: 20, internalMarks: 29, eseMarks: 66, totalMarks: 95, isPassing: true, isConfirmedGradePoint: false },
    { courseCode: 'CE507', credits: 1, earnedCredits: 1, grade: 'A+', gradePoints: 9, creditPoints: 9, internalMarks: 26, eseMarks: 60, totalMarks: 86, isPassing: true, isConfirmedGradePoint: true },
    { courseCode: 'CE508', credits: 2, earnedCredits: 2, grade: 'O', gradePoints: 10, creditPoints: 20, internalMarks: 29, eseMarks: 67, totalMarks: 96, isPassing: true, isConfirmedGradePoint: false },
    { courseCode: 'CE509', credits: 1, earnedCredits: 1, grade: 'A', gradePoints: 8, creditPoints: 8, internalMarks: 24, eseMarks: 52, totalMarks: 76, isPassing: true, isConfirmedGradePoint: true },
  ];

  const dummyStudent = {
    _id: 'dummy-student-id',
    prn: '22UCO01042',
    name: 'AARAV RAJESH SHINDE',
    branch: 'Computer Engineering',
    currentSemester: 5,
  };

  const calculatedSemResult = calculateSemesterResult({
    student: dummyStudent,
    subjectsScores: referenceSubjectScores,
    gradingScheme: defaultScheme,
    academicYear: '2024-2025',
    semester: 5,
  });

  assert('Total CR matches reference = 21', calculatedSemResult.totalCR === 21);
  assert('Total EC matches reference = 21', calculatedSemResult.totalEC === 21);
  assert('Total GP matches reference = 183', calculatedSemResult.totalGP === 183);
  assert('SGPA matches reference exactly = 8.71 (183 / 21)', calculatedSemResult.sgpa === 8.71);
  assert('Result Status classified as PASS - FIRST CLASS WITH DISTINCTION', calculatedSemResult.resultStatus === 'PASS - FIRST CLASS WITH DISTINCTION');
  assert('Confirmed rules list includes A+, A, B+', calculatedSemResult.rulesStatus?.gradePointsConfirmed?.includes('A+'));
  assert('Provisional rules list includes O', calculatedSemResult.rulesStatus?.gradePointsProvisional?.includes('O'));
  assert('Result isPublished remains false (Unpublished state)', calculatedSemResult.isPublished === false);

  // --------------------------------------------------------------------------
  // 7. MISSING MARKS DETECTION
  // --------------------------------------------------------------------------
  console.log('\n7. Missing Marks Detection & Integrity');
  let missingMarksCaught = false;
  try {
    const corruptScores = [...referenceSubjectScores];
    corruptScores[0] = { ...corruptScores[0], totalMarks: null }; // missing marks!
    calculateSemesterResult({
      student: dummyStudent,
      subjectsScores: corruptScores,
    });
  } catch (err) {
    missingMarksCaught = true;
  }
  assert('Engine detects missing course marks and aborts calculation', missingMarksCaught);

  // --------------------------------------------------------------------------
  // 8. API ENDPOINT INTEGRATION TESTS (ADMIN AUTHENTICATED)
  // --------------------------------------------------------------------------
  console.log('\n8. Backend API Endpoints & Administrative Integration');

  // 8a. Authenticate as Admin
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'admin@sanjivani.edu.in', password: 'Admin@123' }),
  });
  assert('Admin login succeeded (200)', adminLogin.status === 200);
  const adminHeaders = { Authorization: `Bearer ${adminLogin.data?.token}` };

  // 8b. Fetch Grading Schemes
  const schemesRes = await request('/admin/grading-schemes', { headers: adminHeaders });
  assert('GET /api/admin/grading-schemes returns 200', schemesRes.status === 200);
  assert('Schemes list contains default autonomous scheme', schemesRes.data?.data?.length > 0);
  assert('Response explicitly documents confirmed and provisional rules', !!schemesRes.data?.confirmedRules && !!schemesRes.data?.provisionalRules);

  // 8c. Fetch Active Scheme
  const activeRes = await request('/admin/grading-schemes/active', { headers: adminHeaders });
  assert('GET /api/admin/grading-schemes/active returns 200', activeRes.status === 200);
  assert('Active scheme has schemeVersion', !!activeRes.data?.data?.schemeVersion);

  // 8d. Reject invalid custom scheme via API (overlapping bounds)
  const invalidApiScheme = await request('/admin/grading-schemes', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      schemeName: 'Invalid Test Scheme',
      schemeVersion: 'INVALID-v1',
      gradeRules: overlappingRules,
    }),
  });
  assert('API rejects overlapping grading scheme with 400 Bad Request', invalidApiScheme.status === 400);

  // 8e. Create valid custom scheme via API
  const customVersion = `AUTO-TEST-${Date.now()}`;
  const validApiScheme = await request('/admin/grading-schemes', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      schemeName: 'Custom Autonomous Scheme',
      schemeVersion: customVersion,
      gradeRules: defaultScheme.gradeRules,
      roundingConventions: { decimalPlaces: 2, roundingMode: 'HALF_UP' },
    }),
  });
  assert('API creates valid custom grading scheme (201)', validApiScheme.status === 201);
  assert('Created scheme version matches', validApiScheme.data?.data?.schemeVersion === customVersion);

  // 8f. Reject duplicate schemeVersion
  const duplicateVersionRes = await request('/admin/grading-schemes', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      schemeName: 'Duplicate Scheme',
      schemeVersion: customVersion,
      gradeRules: defaultScheme.gradeRules,
    }),
  });
  assert('API rejects duplicate schemeVersion with 409 Conflict', duplicateVersionRes.status === 409);

  // --------------------------------------------------------------------------
  // 9. AUTOMATIC SEMESTER COHORT RESULT CALCULATION
  // --------------------------------------------------------------------------
  console.log('\n9. Automatic Semester Cohort Calculation Engine & Invariants');

  // Trigger semester calculation for 2024-2025 Semester 5 Computer Engineering
  const calcRes = await request('/admin/results/calculate-semester', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      academicYear: '2024-2025',
      semester: 5,
      department: 'Computer Engineering',
    }),
  });
  assert('Calculate semester endpoint returns 200 OK', calcRes.status === 200);
  assert('Calculation engine reports missing marks report', Array.isArray(calcRes.data?.missingMarksReport));
  assert('Strict Stage 5 Invariant: Results isPublished is FALSE', calcRes.data?.summary?.isPublished === false);

  // --------------------------------------------------------------------------
  // 10. RECALCULATION AFTER MARKS CORRECTIONS
  // --------------------------------------------------------------------------
  console.log('\n10. Student Result Recalculation After Marks Correction');
  const recalcRes = await request('/admin/results/recalculate/22UCO01042', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      academicYear: '2024-2025',
      semester: 5,
    }),
  });

  // Since Aarav has full marks, recalculation succeeds or reports missing if not all submitted
  if (recalcRes.status === 200) {
    assert('Recalculate result endpoint succeeded (200)', recalcRes.status === 200);
    assert('Calculated record stores gradingSchemeVersion', !!recalcRes.data?.data?.gradingSchemeVersion);
    assert('Calculated record preserves isPublished: false', recalcRes.data?.data?.isPublished === false);
  } else {
    // If some subject has unsubmitted mark, verifies missing marks report
    assert('Correctly rejects incomplete calculation with 400', recalcRes.status === 400);
    assert('Error message specifies missing marks', recalcRes.data?.message?.includes('Missing marks'));
  }

  // --------------------------------------------------------------------------
  // 11. RESULT INSPECTION & SUMMARY METRICS
  // --------------------------------------------------------------------------
  console.log('\n11. Result Inspection & Cohort Summary');
  const summaryRes = await request('/admin/results/summary?academicYear=2024-2025&semester=5', {
    headers: adminHeaders,
  });
  assert('Result summary endpoint returns 200', summaryRes.status === 200);
  assert('Summary specifies publication state as Unpublished / Draft', summaryRes.data?.publicationState?.includes('Unpublished'));

  console.log('\n====================================================');
  console.log(`STAGE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage5Tests().catch((err) => {
  console.error('Fatal error running Stage 5 tests:', err);
  process.exit(1);
});
