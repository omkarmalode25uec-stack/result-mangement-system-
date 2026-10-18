/**
 * STAGE 6 COMPREHENSIVE AUTOMATED TEST SUITE
 * Result Review, Moderation, Publication & Immutable Audit Trail
 */

const BASE_URL = 'http://localhost:5000/api';

let adminHeaders = {};
let facultyHeaders = {};
let studentHeaders = {};
let otherStudentHeaders = {};

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

  const setCookie = response.headers.get('set-cookie');
  const cookie = setCookie ? setCookie.split(';')[0] : '';

  return {
    status: response.status,
    ok: response.ok,
    data,
    cookie,
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

async function loginUser(identifier, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });

  const token = res.data?.token;
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(res.cookie ? { Cookie: res.cookie } : {}),
  };

  return { ok: res.ok, status: res.status, data: res.data, cookie: res.cookie, token, headers };
}

export async function runStage6Tests() {
  console.log('====================================================');
  console.log('RUNNING STAGE 6 RESULT REVIEW & PUBLICATION TESTS');
  console.log('====================================================');

  // 1. Authenticate users
  console.log('\n--- 1. Authenticating Roles (Admin, Faculty, Student) ---');

  const adminLogin = await loginUser('admin@sanjivani.edu.in', 'Admin@123');
  assert('Admin successfully logs in', adminLogin.ok && adminLogin.data.success);
  adminHeaders = adminLogin.headers;

  const facLogin = await loginUser('fac-cs-108', 'Faculty@123');
  assert('Faculty successfully logs in', facLogin.ok && facLogin.data.success);
  facultyHeaders = facLogin.headers;

  const studLogin = await loginUser('22UCO01042', 'Student@123');
  assert('Student 22UCO01042 successfully logs in', studLogin.ok && studLogin.data.success);
  studentHeaders = studLogin.headers;

  const otherStudLogin = await loginUser('22UIT02015', 'Student@123');
  assert('Other Student 22UIT02015 successfully logs in', otherStudLogin.ok && otherStudLogin.data.success);
  otherStudentHeaders = otherStudLogin.headers;

  // 2. Fetch Assigned Courses & Subjects for Faculty
  console.log('\n--- 2. Inspect Assigned Subjects & Load Student Roster ---');
  const assignmentsRes = await request('/faculty/assignments', {
    headers: facultyHeaders,
  });
  assert('Faculty fetches assigned courses', assignmentsRes.ok && assignmentsRes.data.count > 0);
  const activeAssignment = assignmentsRes.data.data[0];
  const subjectId = activeAssignment.subject._id;
  const courseCode = activeAssignment.subject.subjectCode;

  // Load roster
  const initialRosterRes = await request(
    `/faculty/courses/${subjectId}/students?academicYear=2024-2025&semester=5&division=A`,
    { headers: facultyHeaders }
  );
  assert('Faculty loads student roster for course', initialRosterRes.ok && initialRosterRes.data.students?.length > 0);
  const eligibleStudents = initialRosterRes.data.students;

  // Reset cohort to Unpublished Draft state so lifecycle test starts cleanly
  await request('/admin/results/batches/unpublish', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      academicYear: '2024-2025',
      semester: 5,
      branch: 'Computer Engineering',
      targetStatus: 'Draft',
      reason: 'Stage 6 Lifecycle Test: Resetting cohort to Unpublished Draft state',
    }),
  });

  // 3. Draft Mode: Faculty saves draft marks
  console.log('\n--- 3. Marks Lifecycle: Draft Stage ---');
  const draftMarks = eligibleStudents.map((s, idx) => ({
    prn: s.prn,
    internalMarks: 26 + (idx % 4),
    eseMarks: 62 + (idx % 6),
  }));

  // Reopen any prior locks
  await request('/faculty/marks/reopen', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId,
      academicYear: '2024-2025',
      semester: 5,
      division: 'A',
    }),
  });

  const saveDraftRes = await request('/faculty/marks/save-draft', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId,
      academicYear: '2024-2025',
      semester: 5,
      division: 'A',
      marks: draftMarks,
    }),
  });
  assert('Faculty saves marks as Draft', saveDraftRes.ok && saveDraftRes.data.status === 'Draft', JSON.stringify(saveDraftRes.data));

  // 4. Student Privacy Invariant 1: Draft results must never be visible to students
  console.log('\n--- 4. Publication Invariant: Draft Marks Inaccessible to Students ---');
  // First calculate semester results so record exists in database
  const calcRes = await request('/admin/results/calculate-semester', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      academicYear: '2024-2025',
      semester: 5,
      department: 'Computer Engineering',
      division: 'A',
    }),
  });
  assert('Admin calculates semester results (stored as unpublished Draft)', calcRes.ok && calcRes.data.success);

  const studentDraftView = await request('/marksheet/22UCO01042', {
    headers: studentHeaders,
  });
  assert(
    'Student blocked (403) from accessing unpublished Draft Statement of Grades',
    studentDraftView.status === 403,
    `Received status ${studentDraftView.status}`
  );

  // 5. Faculty Submits Completed Marks for Review
  console.log('\n--- 5. Marks Lifecycle: Submit for Review ---');
  const submitMarks = eligibleStudents.map((s, idx) => ({
    prn: s.prn,
    internalMarks: 28 + (idx % 2),
    eseMarks: 65 + (idx % 3),
  }));
  const submitRes = await request('/faculty/marks/submit', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId,
      academicYear: '2024-2025',
      semester: 5,
      division: 'A',
      marks: submitMarks,
    }),
  });
  assert('Faculty submits marks for review', submitRes.ok && submitRes.data.status === 'Submitted');

  // Verify Course Marks status in Roster
  const rosterRes = await request(`/faculty/courses/${subjectId}/students?academicYear=2024-2025&semester=5&division=A`, {
    headers: facultyHeaders,
  });
  assert('Roster status is Submitted', rosterRes.ok && rosterRes.data.stats.submittedCount >= 1);

  // 6. Student Privacy Invariant 2: Submitted results remain private
  console.log('\n--- 6. Publication Invariant: Submitted Results Inaccessible to Students ---');
  const studentSubmittedView = await request('/marksheet/22UCO01042', {
    headers: studentHeaders,
  });
  assert(
    'Student blocked (403) from accessing Submitted results prior to publication',
    studentSubmittedView.status === 403,
    `Received status ${studentSubmittedView.status}`
  );

  // 7. Reviewer / Admin: Inspect batches queue
  console.log('\n--- 7. Admin Batches Queue Inspection ---');
  const batchesRes = await request('/admin/results/batches?academicYear=2024-2025&semester=5', {
    headers: adminHeaders,
  });
  assert('Admin fetches review batches queue', batchesRes.ok && batchesRes.data.courseBatches?.length > 0);
  const foundCourseBatch = batchesRes.data.courseBatches.find((b) => b.subjectId === subjectId);
  assert(
    'Target course batch is found with Submitted status',
    foundCourseBatch && (foundCourseBatch.batchStatus === 'Submitted' || foundCourseBatch.submittedCount > 0)
  );

  // 8. Return for Correction Workflow
  console.log('\n--- 8. Moderation Workflow: Return for Correction with Mandatory Reason ---');
  // Attempt to return without reason (must be rejected with 400)
  const returnNoReason = await request('/admin/results/batches/return', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      batchType: 'course',
      subjectId,
      academicYear: '2024-2025',
      semester: 5,
      reason: '', // Empty reason
    }),
  });
  assert('Returning batch without reason is strictly rejected (400)', returnNoReason.status === 400);

  // Return with valid justification reason
  const validReason = 'Mismatched continuous evaluation scores in Division A. Please re-audit row entries.';
  const returnRes = await request('/admin/results/batches/return', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      batchType: 'course',
      subjectId,
      academicYear: '2024-2025',
      semester: 5,
      reason: validReason,
    }),
  });
  assert('Admin returns course batch for correction with recorded reason', returnRes.ok && returnRes.data.success);

  // Verify Faculty sees returned state and reason
  const rosterAfterReturn = await request(`/faculty/courses/${subjectId}/students?academicYear=2024-2025&semester=5&division=A`, {
    headers: facultyHeaders,
  });
  assert(
    'Faculty receives returned batch status and return reason',
    rosterAfterReturn.ok &&
    rosterAfterReturn.data.stats.batchStatus === 'Returned' &&
    rosterAfterReturn.data.returnReason === validReason
  );
  assert('Faculty roster is unlocked (isLocked: false) for correcting returned marks', rosterAfterReturn.data.isLocked === false);

  // 9. Faculty Corrects Returned Marks and Resubmits
  console.log('\n--- 9. Faculty Resubmission of Corrected Marks ---');
  const correctedMarks = eligibleStudents.map((s, idx) => ({
    prn: s.prn,
    internalMarks: 29,
    eseMarks: 67,
  }));
  const resubmitRes = await request('/faculty/marks/submit', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId,
      academicYear: '2024-2025',
      semester: 5,
      division: 'A',
      marks: correctedMarks,
    }),
  });
  assert('Faculty resubmits corrected marks', resubmitRes.ok && resubmitRes.data.status === 'Submitted');

  // Verify returnReason is cleared on resubmission
  const rosterAfterResubmit = await request(`/faculty/courses/${subjectId}/students?academicYear=2024-2025&semester=5&division=A`, {
    headers: facultyHeaders,
  });
  assert('Return reason is cleared upon resubmission', rosterAfterResubmit.data.returnReason === null);

  // 10. Admin Approves Course Batch
  console.log('\n--- 10. Moderation Workflow: Admin Batch Approval ---');
  const approveCourseRes = await request('/admin/results/batches/approve', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      batchType: 'course',
      subjectId,
      academicYear: '2024-2025',
      semester: 5,
    }),
  });
  assert('Admin approves course mark batch', approveCourseRes.ok && approveCourseRes.data.success);

  // 11. Locking Check: Faculty cannot modify or reopen an Approved batch
  console.log('\n--- 11. Lock Enforcement: Faculty Cannot Edit Approved Batch ---');
  const facultyEditApproved = await request('/faculty/marks/save-draft', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId,
      academicYear: '2024-2025',
      semester: 5,
      division: 'A',
      marks: correctedMarks,
    }),
  });
  assert('Faculty edit on Approved batch is blocked (403 Forbidden)', facultyEditApproved.status === 403);

  const facultyReopenApproved = await request('/faculty/marks/reopen', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId,
      academicYear: '2024-2025',
      semester: 5,
      division: 'A',
    }),
  });
  assert('Faculty reopening an Approved batch is blocked (403 Forbidden)', facultyReopenApproved.status === 403);

  // 12. Semester Result Calculation & Invariant 3: Approved results remain private until published
  console.log('\n--- 12. Approved Results Remain Private Until Published ---');
  await request('/admin/results/calculate-semester', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      academicYear: '2024-2025',
      semester: 5,
      department: 'Computer Engineering',
      division: 'A',
    }),
  });

  // Approve Semester Result Batch
  const approveSemRes = await request('/admin/results/batches/approve', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      batchType: 'semester',
      academicYear: '2024-2025',
      semester: 5,
      branch: 'Computer Engineering',
    }),
  });
  assert('Admin approves semester result cohort', approveSemRes.ok && approveSemRes.data.success);

  // Check student view when Approved but not Published
  const studentApprovedView = await request('/marksheet/22UCO01042', {
    headers: studentHeaders,
  });
  assert(
    'Student blocked (403) from accessing Approved results prior to formal Publication',
    studentApprovedView.status === 403,
    `Received status ${studentApprovedView.status}`
  );

  // 13. Publication Restrictions: Cannot publish Draft or Returned batches
  console.log('\n--- 13. Publication Restriction: Rejection of Unapproved Batches ---');
  const invalidPublish = await request('/admin/results/batches/publish', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      academicYear: '2024-2025',
      semester: 8, // No approved records for Sem 8
      branch: 'Civil Engineering',
    }),
  });
  assert('Publishing non-approved cohort is rejected (404/400)', invalidPublish.status === 404 || invalidPublish.status === 400);

  // 14. Role Authorization: Non-admins cannot approve or publish
  console.log('\n--- 14. Role-Based Authorization Enforcement ---');
  const facultyPublish = await request('/admin/results/batches/publish', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      academicYear: '2024-2025',
      semester: 5,
      branch: 'Computer Engineering',
    }),
  });
  assert('Faculty unauthorized from publishing results (403 Forbidden)', facultyPublish.status === 403);

  const studentPublish = await request('/admin/results/batches/publish', {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      academicYear: '2024-2025',
      semester: 5,
      branch: 'Computer Engineering',
    }),
  });
  assert('Student unauthorized from publishing results (403 Forbidden)', studentPublish.status === 403);

  // 15. Authorized Admin Publishes Result Batch
  console.log('\n--- 15. Official Result Batch Publication ---');
  const publishRes = await request('/admin/results/batches/publish', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      academicYear: '2024-2025',
      semester: 5,
      branch: 'Computer Engineering',
    }),
  });
  assert('Authorized Admin publishes semester result batch', publishRes.ok && publishRes.data.success);
  assert('Publication returns published count & timestamp', publishRes.data.publishedCount > 0 && !!publishRes.data.publishedAt);

  // 16. Student Privacy Invariant 5: Students can access only their own published results
  console.log('\n--- 16. Student Access to Published Statement of Grades ---');
  const studentPublishedView = await request('/marksheet/22UCO01042', {
    headers: studentHeaders,
  });
  assert('Student successfully accesses own published Statement of Grades (200 OK)', studentPublishedView.ok && studentPublishedView.status === 200);
  assert('Published marksheet reflects accurate PRN and SGPA', studentPublishedView.data.data?.prn === '22UCO01042' && studentPublishedView.data.data?.sgpa > 0);

  // Student cannot access another student's marksheet
  const studentAccessOther = await request('/marksheet/22UIT02015', {
    headers: studentHeaders,
  });
  assert('Student is strictly blocked (403) from accessing another student result', studentAccessOther.status === 403);

  // 17. Authorized Post-Publication Correction Workflow
  console.log('\n--- 17. Post-Publication Mark Correction with Recorded Reason ---');
  // Attempt correction without reason (must fail 400)
  const corrNoReason = await request('/admin/results/correct-published', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      prn: '22UCO01042',
      courseCode,
      academicYear: '2024-2025',
      semester: 5,
      internalMarks: 30,
      eseMarks: 70,
      reason: '', // Missing reason
    }),
  });
  assert('Post-publication correction without justification is rejected (400)', corrNoReason.status === 400);

  // Execute authorized correction with recorded reason
  const correctionReason = 'Grievance re-evaluation approved by Examination Cell Committee on 18-Oct-2026';
  const correctionRes = await request('/admin/results/correct-published', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      prn: '22UCO01042',
      courseCode,
      academicYear: '2024-2025',
      semester: 5,
      internalMarks: 30,
      eseMarks: 70,
      reason: correctionReason,
    }),
  });
  assert('Admin successfully applies post-publication correction', correctionRes.ok && correctionRes.data?.success, JSON.stringify(correctionRes.data));
  assert(
    'Dependent values recalculated (total, grade points, SGPA)',
    correctionRes.data.result?.sgpa !== undefined &&
    correctionRes.data.newSGPA !== undefined
  );

  // Verify student view reflects updated SGPA and remains published
  const studentUpdatedView = await request('/marksheet/22UCO01042', {
    headers: studentHeaders,
  });
  assert('Student accesses updated published result', studentUpdatedView.ok && studentUpdatedView.data.data.isPublished === true);

  // 18. Unpublishing Workflow
  console.log('\n--- 18. Unpublishing Workflow ---');
  // Attempt unpublish without reason
  const unpubNoReason = await request('/admin/results/batches/unpublish', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      academicYear: '2024-2025',
      semester: 5,
      branch: 'Computer Engineering',
      reason: '',
    }),
  });
  assert('Unpublishing without justification is rejected (400)', unpubNoReason.status === 400);

  // Unpublish with reason
  const unpubRes = await request('/admin/results/batches/unpublish', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      academicYear: '2024-2025',
      semester: 5,
      branch: 'Computer Engineering',
      reason: 'Temporary administrative audit requested by Dean Academics',
    }),
  });
  assert('Admin unpublishes batch with recorded reason', unpubRes.ok && unpubRes.data.success);

  // Verify student access is immediately restricted after unpublishing
  const studentAfterUnpub = await request('/marksheet/22UCO01042', {
    headers: studentHeaders,
  });
  assert('Student access immediately revoked (403) after unpublishing', studentAfterUnpub.status === 403);

  // Restore publication for production demo
  await request('/admin/results/batches/approve', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      batchType: 'semester',
      academicYear: '2024-2025',
      semester: 5,
      branch: 'Computer Engineering',
    }),
  });
  await request('/admin/results/batches/publish', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      academicYear: '2024-2025',
      semester: 5,
      branch: 'Computer Engineering',
    }),
  });

  // 19. Immutable Audit Trail Inspection
  console.log('\n--- 19. Immutable Audit Trail Verification ---');
  const auditRes = await request('/admin/results/audit-trail', {
    headers: adminHeaders,
  });
  assert('Admin fetches audit trail logs', auditRes.ok && auditRes.data.data?.length > 0);

  const actionsLogged = auditRes.data.data.map((l) => l.action);
  assert('Audit trail records SUBMITTED_FOR_REVIEW', actionsLogged.includes('SUBMITTED_FOR_REVIEW'));
  assert('Audit trail records APPROVED', actionsLogged.includes('APPROVED'));
  assert('Audit trail records RETURNED_FOR_CORRECTION', actionsLogged.includes('RETURNED_FOR_CORRECTION'));
  assert('Audit trail records PUBLISHED', actionsLogged.includes('PUBLISHED'));
  assert('Audit trail records UNPUBLISHED', actionsLogged.includes('UNPUBLISHED'));
  assert('Audit trail records CORRECTED_POST_PUBLICATION', actionsLogged.includes('CORRECTED_POST_PUBLICATION'));

  const correctionLog = auditRes.data.data.find((l) => l.action === 'CORRECTED_POST_PUBLICATION');
  assert(
    'Correction audit log records who, when, PRN, course, reason, and grading scheme version',
    correctionLog &&
    correctionLog.performedByName &&
    correctionLog.performedByRole === 'Admin' &&
    correctionLog.prn === '22UCO01042' &&
    correctionLog.reason === correctionReason &&
    !!correctionLog.gradingSchemeVersion &&
    !!correctionLog.timestamp
  );

  console.log('\n====================================================');
  console.log(`STAGE 6 TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  return { passed, failed };
}

if (process.argv[1]?.endsWith('stage6Tests.js')) {
  runStage6Tests()
    .then(({ failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
