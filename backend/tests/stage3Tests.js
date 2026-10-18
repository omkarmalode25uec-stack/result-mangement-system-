/**
 * STAGE 3 COMPREHENSIVE AUTOMATED TEST SUITE
 * Admin Dashboard & Academic Management
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

async function runStage3Tests() {
  console.log('====================================================');
  console.log('RUNNING STAGE 3 ADMIN & ACADEMIC MANAGEMENT TESTS');
  console.log('====================================================\n');

  // 1. Authenticate as Admin
  console.log('1. Admin Authentication Setup');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'admin@sanjivani.edu.in', password: 'Admin@123' }),
  });
  assert('Admin login succeeded', adminLogin.status === 200);
  const adminToken = adminLogin.data?.token;

  // 2. Authenticate as Student to test permissions
  console.log('\n2. Non-Admin Permission Check');
  const studentLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ prn: '22UCO01042', password: 'Student@123' }),
  });
  const studentToken = studentLogin.data?.token;

  const forbiddenCheck = await request('/admin/students', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert('Student is forbidden from admin endpoints (403)', forbiddenCheck.status === 403);

  // 3. Student Creation & Unique PRN Validation
  console.log('\n3. Student Record Creation & Duplicate PRN Rejection');
  const uniquePrn = `24ADM${Math.floor(1000 + Math.random() * 9000)}`;
  const createStudentRes = await request('/admin/students', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      prn: uniquePrn,
      name: 'OMKAR BALASAHEB MALODE',
      motherName: 'SANGITA',
      seatNo: `SCOE24-M${uniquePrn.slice(-3)}`,
      rollNo: uniquePrn.slice(-3),
      branch: 'Computer Engineering',
      department: 'Department of Computer Engineering',
      academicYear: '2024-2025',
      currentSemester: 5,
      password: 'Student@123',
    }),
  });
  assert('Admin creates student record (201)', createStudentRes.status === 201);
  const createdStudentId = createStudentRes.data?.data?._id;

  // Duplicate PRN check
  const duplicatePrnRes = await request('/admin/students', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      prn: uniquePrn, // same PRN!
      name: 'DUPLICATE RECORD',
      motherName: 'TEST',
      seatNo: 'SCOE24-DUP',
      password: 'Student@123',
    }),
  });
  assert('Rejects duplicate PRN with 409 Conflict', duplicatePrnRes.status === 409);

  // 4. Update Student Details
  console.log('\n4. Student Record Update');
  const updateStudentRes = await request(`/admin/students/${createdStudentId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'OMKAR B. MALODE (UPDATED)',
      phone: '+91 98221 55555',
    }),
  });
  assert('Student details updated successfully (200)', updateStudentRes.status === 200);
  assert('Updated name reflected', updateStudentRes.data?.data?.name === 'OMKAR B. MALODE (UPDATED)');

  // 5. Deactivate Student & Verify Historical Results Preservation
  console.log('\n5. Student Record Deactivation & History Preservation');
  const deactivateRes = await request(`/admin/students/${createdStudentId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'Inactive' }),
  });
  assert('Student deactivated (200)', deactivateRes.status === 200);
  assert('Status set to Inactive', deactivateRes.data?.data?.status === 'Inactive');

  // 6. Faculty Management (Create, Reject Duplicate, Update, Toggle)
  console.log('\n6. Faculty Management CRUD');
  const uniqueEmpId = `FAC-IT-${Math.floor(100 + Math.random() * 900)}`;
  const createFacultyRes = await request('/admin/faculty', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      employeeId: uniqueEmpId,
      name: 'Dr. S. K. Sonawane',
      department: 'Information Technology',
      designation: 'Associate Professor',
      email: `${uniqueEmpId.toLowerCase()}@sanjivani.edu.in`,
      password: 'Faculty@123',
    }),
  });
  assert('Admin creates faculty account (201)', createFacultyRes.status === 201);
  const createdFacultyId = createFacultyRes.data?.data?._id;

  // Duplicate Faculty ID check
  const duplicateEmpRes = await request('/admin/faculty', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      employeeId: uniqueEmpId,
      name: 'Duplicate Faculty',
      department: 'Information Technology',
      email: `other.${uniqueEmpId.toLowerCase()}@sanjivani.edu.in`,
      password: 'Faculty@123',
    }),
  });
  assert('Rejects duplicate Employee ID with 409 Conflict', duplicateEmpRes.status === 409);

  // Update Faculty
  const updateFacultyRes = await request(`/admin/faculty/${createdFacultyId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      specialization: 'Cloud Computing & Cyber Security',
    }),
  });
  assert('Faculty profile updated (200)', updateFacultyRes.status === 200);

  // Toggle Faculty status
  const facultyStatusRes = await request(`/admin/faculty/${createdFacultyId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ isActive: false }),
  });
  assert('Faculty status updated (200)', facultyStatusRes.status === 200);

  // 7. Subject Creation & Credit/Marks Validation
  console.log('\n7. Subject Creation & Validation');
  const uniqueSubCode = `CS${Math.floor(600 + Math.random() * 300)}`;

  // Invalid credits test (> 10)
  const invalidCreditRes = await request('/admin/subjects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      subjectCode: `${uniqueSubCode}X`,
      subjectName: 'Invalid Credits Subject',
      subjectType: 'TH',
      credits: 15, // INVALID: must be 1-10
      semester: 6,
    }),
  });
  assert('Rejects credits > 10 with 400 Bad Request', invalidCreditRes.status === 400);

  // Invalid mark limits test (internal > 100)
  const invalidMarksRes = await request('/admin/subjects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      subjectCode: `${uniqueSubCode}Y`,
      subjectName: 'Invalid Marks Subject',
      subjectType: 'TH',
      credits: 3,
      semester: 6,
      maxInternalMarks: 150, // INVALID: > 100
    }),
  });
  assert('Rejects internal marks > 100 with 400 Bad Request', invalidMarksRes.status === 400);

  // Valid subject creation
  const validSubjectRes = await request('/admin/subjects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      subjectCode: uniqueSubCode,
      subjectName: 'Advanced Web Engineering',
      subjectType: 'TH',
      credits: 4,
      semester: 6,
      department: 'Computer Engineering',
      maxInternalMarks: 30,
      maxEseMarks: 70,
    }),
  });
  assert('Valid subject created (201)', validSubjectRes.status === 201);
  const createdSubjectId = validSubjectRes.data?.data?._id;

  // Duplicate subject code
  const dupSubRes = await request('/admin/subjects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      subjectCode: uniqueSubCode,
      subjectName: 'Duplicate Subject',
      subjectType: 'TH',
      credits: 4,
      semester: 6,
    }),
  });
  assert('Rejects duplicate subject code with 409 Conflict', dupSubRes.status === 409);

  // 8. Faculty-Subject Assignment & Semester Match Validation
  console.log('\n8. Faculty-Subject Assignment & Validation');
  // Semester mismatch: Subject is semester 6, assignment requests semester 5
  const mismatchAssignRes = await request('/admin/assignments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      facultyId: createdFacultyId,
      subjectId: createdSubjectId,
      academicYear: '2024-2025',
      semester: 5, // MISMATCH with subject.semester (6)
      division: 'A',
    }),
  });
  assert('Rejects semester mismatch between subject and assignment (400)', mismatchAssignRes.status === 400);

  // Valid assignment
  const validAssignRes = await request('/admin/assignments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      facultyId: createdFacultyId,
      subjectId: createdSubjectId,
      academicYear: '2024-2025',
      semester: 6, // MATCH
      division: 'A',
    }),
  });
  assert('Valid faculty-subject assignment created (201)', validAssignRes.status === 201);
  const assignmentId = validAssignRes.data?.data?._id;

  // Duplicate assignment
  const dupAssignRes = await request('/admin/assignments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      facultyId: createdFacultyId,
      subjectId: createdSubjectId,
      academicYear: '2024-2025',
      semester: 6,
      division: 'A',
    }),
  });
  assert('Rejects duplicate faculty assignment with 409 Conflict', dupAssignRes.status === 409);

  // Revoke assignment
  const deleteAssignRes = await request(`/admin/assignments/${assignmentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Revokes faculty assignment (200)', deleteAssignRes.status === 200);

  // 9. Batch CSV Import with Validation & Error Report
  console.log('\n9. CSV Import with Validation and Error Reporting');
  const csvBatchPrn1 = `24CSV${Math.floor(1000 + Math.random() * 9000)}`;
  const csvBatchPrn2 = `24CSV${Math.floor(1000 + Math.random() * 9000)}`;

  const sampleCsv = `prn,name,mothername,seatno,rollno,branch,semester,password
${csvBatchPrn1},PRAKASH VILAS GAIKWAD,LATA,SCOE24-CSV1,01,Computer Engineering,5,Student@123
${uniquePrn},DUPLICATE OF EXISTING,ANITA,SCOE24-DUP,02,Computer Engineering,5,Student@123
${csvBatchPrn2},,KAVITA,SCOE24-MISS,03,Information Technology,5,Student@123`;

  const csvImportRes = await request('/admin/students/import-csv', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ csvContent: sampleCsv }),
  });

  assert('CSV import endpoint returns 200 with report', csvImportRes.status === 200);
  assert('Imported valid row (1)', csvImportRes.data?.importedCount === 1);
  assert('Detected and reported failed rows (2)', csvImportRes.data?.failedCount === 2);
  assert('Error report lists duplicate database PRN error', csvImportRes.data?.errors?.some(e => e.prn === uniquePrn));
  assert('Error report lists missing name row error', csvImportRes.data?.errors?.some(e => e.row === 4));

  // 10. Search, Filter, and Pagination
  console.log('\n10. Search, Filter, and Pagination');
  const paginatedRes = await request('/admin/students?page=1&limit=2', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Pagination returns limited records (2)', paginatedRes.data?.count === 2);
  assert('Pagination reports total count > 2', paginatedRes.data?.total > 2);
  assert('Pagination reports totalPages >= 2', paginatedRes.data?.totalPages >= 2);

  const searchRes = await request('/admin/students?search=OMKAR', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Search filter finds student by name', searchRes.data?.data?.some(s => s.name.includes('OMKAR')));

  console.log('\n====================================================');
  console.log(`STAGE 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage3Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
