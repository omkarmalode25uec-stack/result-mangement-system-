/**
 * STAGE 4 COMPREHENSIVE AUTOMATED TEST SUITE
 * Faculty Marks Entry Workflow
 */

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

async function runStage4Tests() {
  console.log('====================================================');
  console.log('RUNNING STAGE 4 FACULTY MARKS ENTRY WORKFLOW TESTS');
  console.log('====================================================\n');

  // 0. Reset any publication or approval locks so faculty draft workflow tests can run cleanly
  const resetAdminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'admin@sanjivani.edu.in', password: 'Admin@123' }),
  });
  if (resetAdminLogin.ok && resetAdminLogin.data?.token) {
    await request('/admin/results/batches/unpublish', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resetAdminLogin.data.token}` },
      body: JSON.stringify({
        academicYear: '2024-2025',
        semester: 5,
        branch: 'Computer Engineering',
        targetStatus: 'Draft',
        reason: 'Reset locks for Stage 4 faculty workflow tests',
      }),
    });
  }

  // 1. Authenticate as Faculty (Prof. R. M. Kulkarni)
  console.log('1. Faculty Authentication');
  const facultyLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'fac-cs-108', password: 'Faculty@123' }),
  });
  assert('Faculty login succeeded', facultyLogin.status === 200, JSON.stringify(facultyLogin.data));
  assert('User role is Faculty', facultyLogin.data?.user?.role === 'Faculty');
  const facultyToken = facultyLogin.data?.token;
  const facultyHeaders = { Authorization: `Bearer ${facultyToken}` };

  // 2. Authenticate as Student to test unauthorized access
  console.log('\n2. Role-based Access Authorization Check');
  const studentLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: '22uco01042', password: 'Student@123' }),
  });
  const studentToken = studentLogin.data?.token;
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  const studentAccessFaculty = await request('/faculty/assignments', {
    headers: studentHeaders,
  });
  assert('Student is forbidden from accessing faculty assignments (403)', studentAccessFaculty.status === 403);

  // 3. Faculty Profile Endpoint
  console.log('\n3. Faculty Profile Endpoint');
  const profileRes = await request('/faculty/profile', {
    headers: facultyHeaders,
  });
  assert('Faculty profile endpoint returns 200', profileRes.status === 200);
  assert('Faculty Employee ID matches FAC-CS-108', profileRes.data?.data?.employeeId === 'FAC-CS-108');
  assert('Faculty Department is Computer Engineering', profileRes.data?.data?.department === 'Computer Engineering');

  // 4. Assigned Courses Roster: Faculty sees only their assigned subjects
  console.log('\n4. Assigned Courses Retrieval (Faculty sees only assigned subjects)');
  const assignmentsRes = await request('/faculty/assignments', {
    headers: facultyHeaders,
  });
  assert('Assignments endpoint returns 200', assignmentsRes.status === 200);
  assert('Returns at least 1 active assignment', assignmentsRes.data?.count >= 1);
  const assignments = assignmentsRes.data?.data || [];
  const assignedCodes = assignments.map((a) => a.subject?.subjectCode);
  console.log(`     Assigned courses found: ${assignedCodes.join(', ')}`);
  assert('Assigned subjects include CE501 (DBMS)', assignedCodes.includes('CE501'));

  const ce501Assignment = assignments.find((a) => a.subject?.subjectCode === 'CE501');
  const ce501Subject = ce501Assignment?.subject;

  // 5. Access Control: Prevent faculty from entering marks for unassigned subjects
  console.log('\n5. Unassigned Subject Access Prevention');
  // Create an unassigned subject as Admin first to test unauthorized faculty access
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'admin@sanjivani.edu.in', password: 'Admin@123' }),
  });
  const adminHeaders = { Authorization: `Bearer ${adminLogin.data?.token}` };

  const uniqueCode = `ME${Math.floor(100 + Math.random() * 900)}`;
  const unassignedSubRes = await request('/admin/subjects', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      subjectCode: uniqueCode,
      subjectName: 'Advanced Thermodynamics (Unassigned to CS Faculty)',
      subjectType: 'TH',
      credits: 3,
      semester: 5,
      department: 'Mechanical Engineering',
      maxInternalMarks: 30,
      maxEseMarks: 70,
    }),
  });
  const unassignedSubjectId = unassignedSubRes.data?.data?._id;

  if (unassignedSubjectId) {
    const unassignedRosterRes = await request(
      `/faculty/courses/${unassignedSubjectId}/students?academicYear=2024-2025&semester=5`,
      { headers: facultyHeaders }
    );
    assert(
      'Rejects faculty from accessing unassigned subject with 403 Forbidden',
      unassignedRosterRes.status === 403
    );

    const unassignedSaveRes = await request('/faculty/marks/save-draft', {
      method: 'POST',
      headers: facultyHeaders,
      body: JSON.stringify({
        subjectId: unassignedSubjectId,
        academicYear: '2024-2025',
        semester: 5,
        marks: [{ prn: '22UCO01042', internalMarks: 20, eseMarks: 50 }],
      }),
    });
    assert(
      'Rejects saving marks for unassigned subject with 403 Forbidden',
      unassignedSaveRes.status === 403
    );
  }

  // 6. Loading Eligible Students for Assigned Subject
  console.log('\n6. Loading Eligible Students for Assigned Subject');
  const studentsRes = await request(
    `/faculty/courses/${ce501Subject._id}/students?academicYear=2024-2025&semester=5&division=A`,
    { headers: facultyHeaders }
  );
  assert('Loading course students returns 200', studentsRes.status === 200);
  assert('Roster contains students', studentsRes.data?.students?.length > 0);
  assert('Roster includes student PRN 22UCO01042', studentsRes.data?.students?.some((s) => s.prn === '22UCO01042'));
  const targetStudent = studentsRes.data?.students?.find((s) => s.prn === '22UCO01042');
  assert('Student has maxInternal and maxEse configured', targetStudent?.maxInternal === 30 && targetStudent?.maxEse === 70);

  // 7. Save Draft Validation: Negative Marks, Exceeding Limits, Non-numeric, Duplicates
  console.log('\n7. Mark Entry Validation Rules (Save Draft)');
  
  // 7a. Reject negative internal marks
  const negInternalRes = await request('/faculty/marks/save-draft', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId: ce501Subject._id,
      academicYear: '2024-2025',
      semester: 5,
      marks: [{ prn: '22UCO01042', internalMarks: -5, eseMarks: 50 }],
    }),
  });
  assert('Rejects negative internal marks with 400 Bad Request', negInternalRes.status === 400);
  assert('Row-level error reported for internal marks', negInternalRes.data?.errors?.some((e) => e.field === 'internalMarks'));

  // 7b. Reject internal marks exceeding maximum
  const exceedInternalRes = await request('/faculty/marks/save-draft', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId: ce501Subject._id,
      academicYear: '2024-2025',
      semester: 5,
      marks: [{ prn: '22UCO01042', internalMarks: 35, eseMarks: 50 }], // max is 30
    }),
  });
  assert('Rejects internal marks exceeding 30 with 400 Bad Request', exceedInternalRes.status === 400);

  // 7c. Reject negative ESE marks
  const negEseRes = await request('/faculty/marks/save-draft', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId: ce501Subject._id,
      academicYear: '2024-2025',
      semester: 5,
      marks: [{ prn: '22UCO01042', internalMarks: 25, eseMarks: -10 }],
    }),
  });
  assert('Rejects negative final examination marks with 400 Bad Request', negEseRes.status === 400);

  // 7d. Reject final marks exceeding maximum
  const exceedEseRes = await request('/faculty/marks/save-draft', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId: ce501Subject._id,
      academicYear: '2024-2025',
      semester: 5,
      marks: [{ prn: '22UCO01042', internalMarks: 25, eseMarks: 85 }], // max is 70
    }),
  });
  assert('Rejects final examination marks exceeding 70 with 400 Bad Request', exceedEseRes.status === 400);

  // 7e. Reject non-numeric marks
  const nonNumericRes = await request('/faculty/marks/save-draft', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId: ce501Subject._id,
      academicYear: '2024-2025',
      semester: 5,
      marks: [{ prn: '22UCO01042', internalMarks: 'invalid', eseMarks: 50 }],
    }),
  });
  assert('Rejects non-numeric marks with 400 Bad Request', nonNumericRes.status === 400);

  // 7f. Reject duplicate PRN in the same batch
  const duplicateBatchRes = await request('/faculty/marks/save-draft', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId: ce501Subject._id,
      academicYear: '2024-2025',
      semester: 5,
      marks: [
        { prn: '22UCO01042', internalMarks: 25, eseMarks: 60 },
        { prn: '22UCO01042', internalMarks: 28, eseMarks: 62 },
      ],
    }),
  });
  assert('Rejects duplicate PRN within same submission batch with 400 Bad Request', duplicateBatchRes.status === 400);

  // 8. Save Valid Marks as Draft & Backend Total Calculation
  console.log('\n8. Save Valid Marks as Draft & Backend Official Total Calculation');
  const validDraftRes = await request('/faculty/marks/save-draft', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId: ce501Subject._id,
      academicYear: '2024-2025',
      semester: 5,
      division: 'A',
      marks: [{ prn: '22UCO01042', internalMarks: 26, eseMarks: 58 }],
    }),
  });
  assert('Valid draft marks saved with 200 OK', validDraftRes.status === 200);
  assert('Status is Draft', validDraftRes.data?.status === 'Draft');

  // Verify stored record and backend calculated total (26 + 58 = 84)
  const verifyDraftRoster = await request(
    `/faculty/courses/${ce501Subject._id}/students?academicYear=2024-2025&semester=5&division=A`,
    { headers: facultyHeaders }
  );
  const updatedStudent = verifyDraftRoster.data?.students?.find((s) => s.prn === '22UCO01042');
  assert('Student status updated to Draft', updatedStudent?.status === 'Draft');
  assert('Internal marks stored as 26', updatedStudent?.internalMarks === 26);
  assert('Final marks stored as 58', updatedStudent?.eseMarks === 58);
  assert('Backend calculated official total as 84 (26 + 58)', updatedStudent?.totalMarks === 84);

  // 9. Reopen and Correct Draft Marks
  console.log('\n9. Reopen and Correct Draft Marks');
  const correctDraftRes = await request('/faculty/marks/save-draft', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId: ce501Subject._id,
      academicYear: '2024-2025',
      semester: 5,
      division: 'A',
      marks: [{ prn: '22UCO01042', internalMarks: 28, eseMarks: 62 }],
    }),
  });
  assert('Draft correction saved with 200 OK', correctDraftRes.status === 200);

  const verifyCorrected = await request(
    `/faculty/courses/${ce501Subject._id}/students?academicYear=2024-2025&semester=5&division=A`,
    { headers: facultyHeaders }
  );
  const correctedStudent = verifyCorrected.data?.students?.find((s) => s.prn === '22UCO01042');
  assert('Corrected internal marks stored as 28', correctedStudent?.internalMarks === 28);
  assert('Corrected final marks stored as 62', correctedStudent?.eseMarks === 62);
  assert('Corrected total marks updated to 90 (28 + 62)', correctedStudent?.totalMarks === 90);

  // 10. Duplicate Prevention for Same Student, Subject, and Attempt
  console.log('\n10. Duplicate Prevention Invariant');
  // Querying students roster should have exactly 1 record for 22UCO01042
  const matches = verifyCorrected.data?.students?.filter((s) => s.prn === '22UCO01042');
  assert('Exactly one mark record exists for student attempt', matches?.length === 1);

  // 11. Submit for Review Validation (Reject missing marks)
  console.log('\n11. Submit for Review Validation');
  const incompleteSubmitRes = await request('/faculty/marks/submit', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId: ce501Subject._id,
      academicYear: '2024-2025',
      semester: 5,
      division: 'A',
      marks: [{ prn: '22UCO01042', internalMarks: 28, eseMarks: null }], // missing ese
    }),
  });
  assert('Rejects incomplete submission with 400 Bad Request', incompleteSubmitRes.status === 400);
  assert(
    'Error report indicates final examination marks required',
    incompleteSubmitRes.data?.errors?.some((e) => e.field === 'eseMarks')
  );

  // 12. Submit for Review (Final Batch Submission)
  console.log('\n12. Submit for Review (Status: Submitted)');
  const allStudents = verifyCorrected.data?.students || [];
  const fullSubmissionPayload = allStudents.map((s) => ({
    prn: s.prn,
    internalMarks: s.internalMarks || 25,
    eseMarks: s.eseMarks || 55,
  }));

  const submitRes = await request('/faculty/marks/submit', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId: ce501Subject._id,
      academicYear: '2024-2025',
      semester: 5,
      division: 'A',
      marks: fullSubmissionPayload,
    }),
  });
  assert('Submit for review succeeds with 200 OK', submitRes.status === 200);
  assert('Batch status is Submitted', submitRes.data?.status === 'Submitted');

  // Verify roster status changed to Submitted
  const verifySubmittedRoster = await request(
    `/faculty/courses/${ce501Subject._id}/students?academicYear=2024-2025&semester=5&division=A`,
    { headers: facultyHeaders }
  );
  assert('Roster reports batchStatus as Submitted', verifySubmittedRoster.data?.stats?.batchStatus === 'Submitted');
  assert('Roster is marked as locked', verifySubmittedRoster.data?.isLocked === true);

  // 13. Safety Rule: Saving marks must never publish results automatically
  console.log('\n13. Safety Invariant: Saving marks does not auto-publish results');
  // Check the public or student preview marksheet: published state should remain controlled by COE
  const studentResultRes = await request('/marksheet/22UCO01042', {
    headers: studentHeaders,
  });
  assert(
    'Saving marks does not auto-publish results (remains unpublished/private)',
    studentResultRes.status === 403 || (studentResultRes.status === 200 && studentResultRes.data?.data?.isPublished === false)
  );

  // 14. Reopen Submitted Draft for Editing & Corrections
  console.log('\n14. Reopen Draft for Corrections');
  const reopenRes = await request('/faculty/marks/reopen', {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      subjectId: ce501Subject._id,
      academicYear: '2024-2025',
      semester: 5,
      division: 'A',
    }),
  });
  assert('Reopen draft succeeds with 200 OK', reopenRes.status === 200);

  const verifyReopenedRoster = await request(
    `/faculty/courses/${ce501Subject._id}/students?academicYear=2024-2025&semester=5&division=A`,
    { headers: facultyHeaders }
  );
  assert('Roster reports batchStatus as Draft after reopening', verifyReopenedRoster.data?.stats?.batchStatus === 'Draft');
  assert('Roster is no longer locked', verifyReopenedRoster.data?.isLocked === false);

  console.log('\n====================================================');
  console.log(`STAGE 4 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage4Tests().catch((err) => {
  console.error('Fatal error running Stage 4 tests:', err);
  process.exit(1);
});
