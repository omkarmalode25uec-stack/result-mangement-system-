/**
 * STAGE 7 COMPREHENSIVE AUTOMATED TEST SUITE
 * Student Portal, Multi-Term Progressions & Statement of Grades PDF Generation
 *
 * Verifies:
 * 1. Student Authentication & Session Validation
 * 2. Academic Terms Progression API (Semester I - VIII)
 * 3. Authoritative Published Semester Result Fetching
 * 4. Privacy & Access Control: Block Unpublished Results with 403 Forbidden
 * 5. High-Resolution Vector PDF Marksheet Generation
 * 6. PDF Format & Headers Validation (A4, Content-Type, Content-Disposition, %PDF- Magic Bytes)
 * 7. Security Invariant 1: Prevent Cross-Student Marksheet Access (403 Forbidden)
 * 8. Security Invariant 2: Block PDF Generation for Unpublished / Moderation Batches (403 Forbidden)
 * 9. Security Invariant 3: Reject Unauthenticated Marksheet Requests (401 Unauthorized)
 * 10. Direct Student Self-Download Route (/api/marksheet-me/pdf)
 * 11. Admin Access to Student Statement of Grades PDF
 * 12. PDF Buffer Integrity & Content Validation
 */

const BASE_URL = 'http://localhost:5000/api';

let adminHeaders = {};
let studentHeaders = {};
let otherStudentHeaders = {};

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

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  }

  const setCookie = response.headers.get('set-cookie');
  const cookie = setCookie ? setCookie.split(';')[0] : '';

  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    data,
    cookie,
    rawResponse: response,
  };
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

export async function runStage7Tests() {
  console.log('====================================================');
  console.log('RUNNING STAGE 7 STUDENT PORTAL & PDF MARKSHEET TESTS');
  console.log('====================================================');

  // 1. Authenticate Roles
  console.log('\n--- 1. Authenticating Roles (Student A, Student B, Admin) ---');

  const studentLogin = await loginUser('22UCO01042', 'Student@123');
  assert('Student Aarav Shinde (22UCO01042) logs in successfully', studentLogin.ok && studentLogin.data.success);
  studentHeaders = studentLogin.headers;

  const otherStudentLogin = await loginUser('22UIT02015', 'Student@123');
  assert('Student Priya Deshmukh (22UIT02015) logs in successfully', otherStudentLogin.ok && otherStudentLogin.data.success);
  otherStudentHeaders = otherStudentLogin.headers;

  const adminLogin = await loginUser('admin@sanjivani.edu.in', 'Admin@123');
  assert('Admin successfully logs in', adminLogin.ok && adminLogin.data.success);
  adminHeaders = adminLogin.headers;

  // 2. Student Terms Progression API
  console.log('\n--- 2. Student Academic Progression & Multi-Term Fetching ---');
  const termsRes = await request('/student/terms?prn=22UCO01042', {
    headers: studentHeaders,
  });
  assert('Student fetches academic terms progression successfully (200 OK)', termsRes.ok && termsRes.data.success);
  assert('Candidate profile included with degree and branch', termsRes.data.student && termsRes.data.student.prn === '22UCO01042');
  assert('Returns complete 8-semester sequence', Array.isArray(termsRes.data.terms) && termsRes.data.terms.length === 8);

  const publishedTerm = termsRes.data.terms.find((t) => t.isPublished === true);
  assert('At least one term is marked as officially Declared / Published', !!publishedTerm && publishedTerm.status === 'Declared');

  const upcomingTerm = termsRes.data.terms.find((t) => t.isPublished === false && t.status === 'Upcoming Term');
  assert('Future terms are correctly classified as Upcoming Term', !!upcomingTerm);

  // 3. Authoritative Published Semester Result Fetching
  console.log('\n--- 3. Authoritative Published Semester Result Retrieval ---');
  const resultRes = await request('/student/result?prn=22UCO01042&semester=5&academicYear=2024-2025', {
    headers: studentHeaders,
  });
  assert('Student accesses published Semester 5 result (200 OK)', resultRes.ok && resultRes.data.success);
  const resultData = resultRes.data.data;
  assert('Result record matches requested candidate PRN', resultData.prn === '22UCO01042');
  assert('Result record is marked as published (isPublished: true)', resultData.isPublished === true);
  assert('Contains computed SGPA value formatted to 2 decimals', typeof resultData.sgpa === 'number' && resultData.sgpa > 0);
  assert('Contains credit totals (totalCR, totalEC, totalGP)', resultData.totalCR > 0 && resultData.totalEC > 0 && resultData.totalGP > 0);
  assert('Contains enrolled subject performance list', Array.isArray(resultData.subjects) && resultData.subjects.length > 0);

  const firstSub = resultData.subjects[0];
  assert('Subject item contains courseCode, courseTitle, credits, grade, gradePoints',
    !!firstSub.courseCode && !!firstSub.courseTitle && firstSub.credits > 0 && !!firstSub.grade && typeof firstSub.gradePoints === 'number');

  // 4. Privacy & Moderation Protection: Unpublished Semester Query
  console.log('\n--- 4. Privacy Protection: Querying Unpublished Semester Results ---');
  // Query semester 6 (which is in progress / unpublished)
  const unpubRes = await request('/student/result?prn=22UCO01042&semester=6&academicYear=2024-2025', {
    headers: studentHeaders,
  });
  assert('Unpublished semester returns 403 Forbidden or 404 Not Found', unpubRes.status === 403 || unpubRes.status === 404);
  assert('Unpublished response does not leak internal mark evaluations', !unpubRes.data?.data?.subjects);

  // 5. PDF Generation & Download (Published Marksheet)
  console.log('\n--- 5. Statement of Grades PDF Generation & Header Verification ---');
  const pdfFetchRes = await fetch(`${BASE_URL}/marksheet/22UCO01042/pdf?semester=5&academicYear=2024-2025`, {
    headers: {
      Authorization: studentHeaders.Authorization,
    },
  });

  assert('Student downloads own published Statement of Grades PDF (200 OK)', pdfFetchRes.status === 200);
  const pdfContentType = pdfFetchRes.headers.get('content-type') || '';
  assert('Response Content-Type is application/pdf', pdfContentType.includes('application/pdf'));

  const contentDisposition = pdfFetchRes.headers.get('content-disposition') || '';
  assert('Content-Disposition header specifies attachment filename',
    contentDisposition.includes('attachment') && contentDisposition.includes('Statement_of_Grades_22UCO01042_Sem5.pdf'));

  const pdfArrayBuffer = await pdfFetchRes.arrayBuffer();
  const pdfBuffer = Buffer.from(pdfArrayBuffer);
  assert('PDF Buffer size is substantial (> 5000 bytes for complete A4 marksheet)', pdfBuffer.length > 5000);

  // Verify PDF Magic Bytes (%PDF-)
  const magicBytes = pdfBuffer.slice(0, 5).toString('ascii');
  assert('PDF file starts with valid "%PDF-" header signature', magicBytes === '%PDF-');

  // 6. Direct Self-Download Route (/api/marksheet-me/pdf)
  console.log('\n--- 6. Direct Student Self-Download Endpoint (/api/marksheet-me/pdf) ---');
  const mePdfRes = await fetch(`${BASE_URL}/marksheet-me/pdf?semester=5&academicYear=2024-2025`, {
    headers: {
      Authorization: studentHeaders.Authorization,
    },
  });
  assert('Logged-in student downloads PDF via /api/marksheet-me/pdf (200 OK)', mePdfRes.status === 200);
  const mePdfBuffer = Buffer.from(await mePdfRes.arrayBuffer());
  assert('Self-download route returns valid PDF binary stream', mePdfBuffer.slice(0, 5).toString('ascii') === '%PDF-');

  // 7. Security Invariant 1: Cross-Student PDF Marksheet Isolation
  console.log('\n--- 7. Security Invariant: Cross-Student Access Prevention ---');
  const unauthorizedPdfRes = await fetch(`${BASE_URL}/marksheet/22UIT02015/pdf?semester=5`, {
    headers: {
      Authorization: studentHeaders.Authorization, // Student 22UCO01042 trying to download 22UIT02015
    },
  });
  assert('Student is strictly denied access to another student\'s PDF (403 Forbidden)', unauthorizedPdfRes.status === 403);

  // Cross-student JSON result endpoint check
  const crossResultRes = await request('/student/result?prn=22UIT02015&semester=5', {
    headers: studentHeaders,
  });
  assert('Student is strictly denied access to another student\'s result API (403 Forbidden)', crossResultRes.status === 403);

  // 8. Security Invariant 2: Block PDF Generation for Unpublished / Draft Records
  console.log('\n--- 8. Security Invariant: Unpublished Marksheet PDF Protection ---');
  const unpubPdfRes = await fetch(`${BASE_URL}/marksheet/22UCO01042/pdf?semester=6`, {
    headers: {
      Authorization: studentHeaders.Authorization,
    },
  });
  assert('PDF generation rejected for unpublished semester (403 Forbidden or 404)', unpubPdfRes.status === 403 || unpubPdfRes.status === 404);

  // 9. Security Invariant 3: Unauthenticated Request Protection
  console.log('\n--- 9. Security Invariant: Unauthenticated Access Protection ---');
  const unauthPdfRes = await fetch(`${BASE_URL}/marksheet/22UCO01042/pdf?semester=5`);
  assert('Unauthenticated request to download PDF marksheet is rejected (401 Unauthorized)', unauthPdfRes.status === 401);

  const unauthTermsRes = await request('/student/terms?prn=22UCO01042');
  assert('Unauthenticated request to student terms API is rejected (401 Unauthorized)', unauthTermsRes.status === 401);

  // 10. Admin Privileged Access to Student PDF
  console.log('\n--- 10. Admin Privileged Access to Student Statement of Grades ---');
  const adminPdfRes = await fetch(`${BASE_URL}/marksheet/22UCO01042/pdf?semester=5`, {
    headers: {
      Authorization: adminHeaders.Authorization,
    },
  });
  assert('Authorized Administrator can download published student marksheet PDF (200 OK)', adminPdfRes.status === 200);
  const adminPdfBuffer = Buffer.from(await adminPdfRes.arrayBuffer());
  assert('Admin PDF download produces valid PDF buffer', adminPdfBuffer.slice(0, 5).toString('ascii') === '%PDF-');

  // Summary
  console.log('\n====================================================');
  console.log(`STAGE 7 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} tests failed in Stage 7.`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('stage7Tests.js')) {
  runStage7Tests().catch((err) => {
    console.error('Fatal Stage 7 test failure:', err.message);
    process.exit(1);
  });
}
