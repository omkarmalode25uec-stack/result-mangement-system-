/**
 * SANJIVANI COLLEGE OF ENGINEERING - AUTOMATIC RESULT CALCULATION ENGINE
 * Authoritative backend calculations for Subject Totals, Grading, Credits, Points, and SGPA.
 * 
 * Rules:
 * - Confirmed Grade Points (from official Sanjivani Statement of Grades):
 *     A+ = 9, A = 8, B+ = 7
 * - Provisional Grade Points (subject to formal college verification):
 *     O = 10, B = 6, C = 5, F = 0
 * - Grade Boundaries (out of 100 percentage):
 *     90-100: O, 80-89: A+, 70-79: A, 60-69: B+, 50-59: B, 40-49: C, Below 40: F
 * - SGPA Formula:
 *     SGPA = Sum(Credits_i * GradePoints_i) / Sum(Credits_i) [Autonomous Credit-Weighted Average]
 */

export const CONFIRMED_RULES = {
  GRADE_POINTS: {
    'A+': 9,
    'A': 8,
    'B+': 7,
  },
  DESCRIPTION: 'Confirmed from official Sanjivani College Statement of Grades reference.',
};

export const PROVISIONAL_RULES = {
  GRADE_POINTS: {
    'O': 10,
    'B': 6,
    'C': 5,
    'P': 4,
    'F': 0,
  },
  BOUNDARIES: [
    { grade: 'O', minPercentage: 90, maxPercentage: 100, isConfirmed: false },
    { grade: 'A+', minPercentage: 80, maxPercentage: 89.99, isConfirmed: true },
    { grade: 'A', minPercentage: 70, maxPercentage: 79.99, isConfirmed: true },
    { grade: 'B+', minPercentage: 60, maxPercentage: 69.99, isConfirmed: true },
    { grade: 'B', minPercentage: 50, maxPercentage: 59.99, isConfirmed: false },
    { grade: 'C', minPercentage: 40, maxPercentage: 49.99, isConfirmed: false },
    { grade: 'F', minPercentage: 0, maxPercentage: 39.99, isConfirmed: false },
  ],
  DESCRIPTION: 'Provisional scale pending formal notification from Controller of Examinations.',
};

/**
 * Returns default autonomous grading scheme definition
 */
export function getDefaultGradingScheme() {
  return {
    schemeName: 'Sanjivani Autonomous Scheme 2022',
    schemeVersion: 'Autonomous Scheme 2022 v1',
    description: 'Autonomous grading scheme with confirmed (A+, A, B+) and provisional (O, B, C, F) scales.',
    applicableYears: ['2022-2023', '2023-2024', '2024-2025'],
    isDefault: true,
    status: 'Active',
    gradeRules: [
      {
        grade: 'O',
        gradePoints: 10,
        minPercentage: 90,
        maxPercentage: 100,
        isConfirmed: false,
        description: 'Outstanding (Provisional)',
        isPassing: true,
      },
      {
        grade: 'A+',
        gradePoints: 9,
        minPercentage: 80,
        maxPercentage: 89.99,
        isConfirmed: true,
        description: 'Excellent (Confirmed)',
        isPassing: true,
      },
      {
        grade: 'A',
        gradePoints: 8,
        minPercentage: 70,
        maxPercentage: 79.99,
        isConfirmed: true,
        description: 'Very Good (Confirmed)',
        isPassing: true,
      },
      {
        grade: 'B+',
        gradePoints: 7,
        minPercentage: 60,
        maxPercentage: 69.99,
        isConfirmed: true,
        description: 'Good (Confirmed)',
        isPassing: true,
      },
      {
        grade: 'B',
        gradePoints: 6,
        minPercentage: 50,
        maxPercentage: 59.99,
        isConfirmed: false,
        description: 'Above Average (Provisional)',
        isPassing: true,
      },
      {
        grade: 'C',
        gradePoints: 5,
        minPercentage: 40,
        maxPercentage: 49.99,
        isConfirmed: false,
        description: 'Average / Passing (Provisional)',
        isPassing: true,
      },
      {
        grade: 'F',
        gradePoints: 0,
        minPercentage: 0,
        maxPercentage: 39.99,
        isConfirmed: false,
        description: 'Fail (Provisional)',
        isPassing: false,
      },
    ],
    passingRequirements: {
      minPassingPercentage: 40,
      minEsePassingPercentage: 40,
      requireSeparatePassing: false,
    },
    subjectCreditRules: {
      allowZeroCreditCourses: false,
      auditCoursesEarnZeroCredits: true,
    },
    sgpaCalculationMethod: {
      formula: 'CREDIT_WEIGHTED_AVERAGE',
      description: 'Sum of (Course Credits * Grade Points) divided by Total Registered Credits',
      isFormulaConfirmed: false,
    },
    roundingConventions: {
      decimalPlaces: 2,
      roundingMode: 'HALF_UP',
    },
  };
}

/**
 * 1. Total marks calculation
 * For a subject with internal and final examinations:
 * Total marks = Internal marks + Final examination marks
 * Validates maximum marks, negative values, and computes percentage.
 */
export function calculateSubjectTotal({
  internalMarks,
  eseMarks,
  maxInternal = 30,
  maxEse = 70,
  totalMax = 100,
}) {
  // Validate presence
  if (internalMarks === null || internalMarks === undefined || internalMarks === '') {
    throw new Error('Internal marks are required and cannot be empty.');
  }
  if (eseMarks === null || eseMarks === undefined || eseMarks === '') {
    throw new Error('Final examination (ESE) marks are required and cannot be empty.');
  }

  const numInternal = Number(internalMarks);
  const numEse = Number(eseMarks);

  if (isNaN(numInternal)) {
    throw new Error(`Internal marks "${internalMarks}" is not a valid number.`);
  }
  if (isNaN(numEse)) {
    throw new Error(`Final examination marks "${eseMarks}" is not a valid number.`);
  }

  // Range validation
  if (numInternal < 0) {
    throw new Error(`Internal marks cannot be negative (${numInternal}).`);
  }
  if (numInternal > maxInternal) {
    throw new Error(`Internal marks (${numInternal}) exceed maximum allowed (${maxInternal}).`);
  }
  if (numEse < 0) {
    throw new Error(`Final examination marks cannot be negative (${numEse}).`);
  }
  if (numEse > maxEse) {
    throw new Error(`Final examination marks (${numEse}) exceed maximum allowed (${maxEse}).`);
  }

  const totalMarks = numInternal + numEse;
  const officialMax = totalMax || maxInternal + maxEse;

  if (totalMarks > officialMax) {
    throw new Error(`Total marks (${totalMarks}) exceed maximum course marks (${officialMax}).`);
  }

  const percentage = (totalMarks / officialMax) * 100;

  return {
    internalMarks: numInternal,
    eseMarks: numEse,
    totalMarks,
    maxInternal,
    maxEse,
    totalMax: officialMax,
    percentage: Number(percentage.toFixed(4)),
  };
}

/**
 * 2. Determine Grade & Grade Points from Percentage based on active grading scheme
 */
export function determineGrade(percentage, gradingScheme = getDefaultGradingScheme()) {
  const rules = gradingScheme.gradeRules || getDefaultGradingScheme().gradeRules;

  // Round percentage to 2 decimal places for boundary comparison
  const roundedPerc = Math.round(percentage * 100) / 100;

  // Find matching interval
  for (const rule of rules) {
    if (roundedPerc >= rule.minPercentage && roundedPerc <= rule.maxPercentage) {
      return {
        grade: rule.grade,
        gradePoints: rule.gradePoints,
        isConfirmed: !!rule.isConfirmed,
        isPassing: rule.isPassing !== false,
        description: rule.description,
      };
    }
  }

  // Edge case for exact 100 or slightly above due to float precision
  if (roundedPerc >= 90) {
    const topRule = rules.find((r) => r.grade === 'O') || rules[0];
    return {
      grade: topRule.grade,
      gradePoints: topRule.gradePoints,
      isConfirmed: !!topRule.isConfirmed,
      isPassing: true,
      description: topRule.description,
    };
  }

  // Fallback to failing grade
  const failRule = rules.find((r) => !r.isPassing) || {
    grade: 'F',
    gradePoints: 0,
    isConfirmed: false,
    isPassing: false,
  };

  return failRule;
}

/**
 * 3. Rounding Helper supporting configured conventions
 */
export function roundNumber(value, decimalPlaces = 2, roundingMode = 'HALF_UP') {
  if (typeof value !== 'number' || isNaN(value)) return 0;

  const factor = Math.pow(10, decimalPlaces);

  switch (roundingMode) {
    case 'TRUNCATE':
      return Math.trunc(value * factor) / factor;
    case 'CEIL':
      return Math.ceil(value * factor) / factor;
    case 'FLOOR':
      return Math.floor(value * factor) / factor;
    case 'HALF_UP':
    default:
      return Math.round(value * factor) / factor;
  }
}

/**
 * 4. Calculate Single Subject Score Record
 */
export function evaluateSubjectScore({
  subject,
  internalMarks,
  eseMarks,
  gradingScheme = getDefaultGradingScheme(),
}) {
  const maxInternal = subject.maxInternalMarks ?? 30;
  const maxEse = subject.maxEseMarks ?? 70;
  const totalMax = subject.totalMaxMarks ?? maxInternal + maxEse;

  // 1. Calculate Total Marks & Percentage
  const markResult = calculateSubjectTotal({
    internalMarks,
    eseMarks,
    maxInternal,
    maxEse,
    totalMax,
  });

  // 2. Determine Grade & Grade Points
  const gradeResult = determineGrade(markResult.percentage, gradingScheme);

  // 3. Credits & Earned Credits
  const credits = Number(subject.credits || 0);
  if (credits < 1) {
    throw new Error(`Subject ${subject.subjectCode || ''} has invalid credits (${credits}). Must be >= 1.`);
  }

  // Earned credits: full credits if passed, 0 if failed
  const earnedCredits = gradeResult.isPassing ? credits : 0;

  // 4. Credit Points: Credits * Grade Points
  const creditPoints = credits * gradeResult.gradePoints;

  return {
    subject: subject._id,
    courseCode: subject.subjectCode,
    courseTitle: subject.subjectName,
    courseType: subject.subjectType,
    credits,
    earnedCredits,
    internalMarks: markResult.internalMarks,
    eseMarks: markResult.eseMarks,
    totalMarks: markResult.totalMarks,
    percentage: markResult.percentage,
    grade: gradeResult.grade,
    gradePoints: gradeResult.gradePoints,
    creditPoints,
    isConfirmedGradePoint: gradeResult.isConfirmed,
    isPassing: gradeResult.isPassing,
  };
}

/**
 * 5. Full Semester Result Calculation Engine
 * Support:
 * - Total CR (Credits Registered)
 * - Total EC (Earned Credits)
 * - Total GP (Grade Points * Credits sum)
 * - SGPA calculation (Total GP / Total CR)
 * - Result Status (Distinction, First Class, Pass, Fail)
 * - Rules Status (Confirmed vs Provisional)
 */
export function calculateSemesterResult({
  student,
  subjectsScores, // array of evaluated subject score records
  gradingScheme = getDefaultGradingScheme(),
  academicYear,
  semester,
  attempt = 1,
  examinationName,
}) {
  if (!student) {
    throw new Error('Student profile is required for result calculation.');
  }

  if (!Array.isArray(subjectsScores) || subjectsScores.length === 0) {
    throw new Error('Cannot calculate semester result: No subject scores provided.');
  }

  let totalCR = 0;
  let totalEC = 0;
  let totalGP = 0;
  let totalMarksObtained = 0;
  let totalMaxMarks = 0;
  let hasFailedCourse = false;

  const confirmedList = new Set();
  const provisionalList = new Set();

  for (const score of subjectsScores) {
    // Missing marks check
    if (score.internalMarks === null || score.eseMarks === null || score.totalMarks === null) {
      throw new Error(`Incomplete evaluation: Missing marks detected for course ${score.courseCode}.`);
    }

    totalCR += score.credits;
    totalEC += score.earnedCredits;
    totalGP += score.creditPoints;
    totalMarksObtained += score.totalMarks;
    totalMaxMarks += score.totalMax || 100;

    if (!score.isPassing || score.grade === 'F') {
      hasFailedCourse = true;
    }

    if (score.isConfirmedGradePoint) {
      confirmedList.add(score.grade);
    } else {
      provisionalList.add(score.grade);
    }
  }

  if (totalCR === 0) {
    throw new Error('Total registered credits cannot be 0.');
  }

  // Formula: SGPA = Total Credit Points (GP) / Total Registered Credits (CR)
  const rawSgpa = totalGP / totalCR;
  const decimalPlaces = gradingScheme.roundingConventions?.decimalPlaces ?? 2;
  const roundingMode = gradingScheme.roundingConventions?.roundingMode ?? 'HALF_UP';
  const sgpa = roundNumber(rawSgpa, decimalPlaces, roundingMode);

  // Overall percentage
  const overallPercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
  const roundedPercentage = roundNumber(overallPercentage, 2, 'HALF_UP');

  // Academic Result Status Classification
  let resultStatus = 'FAIL';
  if (!hasFailedCourse && totalEC === totalCR) {
    if (sgpa >= 7.75) {
      resultStatus = 'PASS - FIRST CLASS WITH DISTINCTION';
    } else if (sgpa >= 6.75) {
      resultStatus = 'PASS - FIRST CLASS';
    } else if (sgpa >= 5.75) {
      resultStatus = 'PASS - HIGHER SECOND CLASS';
    } else if (sgpa >= 5.0) {
      resultStatus = 'PASS - SECOND CLASS';
    } else {
      resultStatus = 'PASS';
    }
  } else {
    // If failed in fewer than 3 subjects, flag ATKT, else FAIL
    const failedCount = subjectsScores.filter((s) => !s.isPassing).length;
    resultStatus = failedCount <= 2 ? 'FAIL - A.T.K.T.' : 'FAIL';
  }

  return {
    student: student._id,
    prn: student.prn,
    seatNo: student.seatNo || 'SCOE24',
    studentName: student.name,
    motherName: student.motherName || 'NOT SPECIFIED',
    branch: student.branch,
    degree: student.degree || 'Bachelor of Technology (B.Tech)',
    academicYear: academicYear || student.academicYear || '2024-2025',
    semester: Number(semester || student.currentSemester || 5),
    semesterLabel: `Semester ${semester || student.currentSemester || 5}`,
    examinationName: examinationName || 'Winter 2024 Autonomous Examination',
    subjects: subjectsScores,
    totalCR,
    totalEC,
    totalGP,
    sgpa,
    cgpa: sgpa, // Set to SGPA initially for single term or calculated across terms
    percentage: roundedPercentage,
    resultStatus,
    attempt: Number(attempt || 1),
    gradingSchemeVersion: gradingScheme.schemeVersion || 'Autonomous Scheme 2022 v1',
    isPublished: false, // Invariant: Calculations do NOT auto-publish
    rulesStatus: {
      gradePointsConfirmed: Array.from(confirmedList),
      gradePointsProvisional: Array.from(provisionalList),
      isFormulaConfirmed: !!gradingScheme.sgpaCalculationMethod?.isFormulaConfirmed,
    },
  };
}
