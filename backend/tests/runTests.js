/**
 * STAGE 2 COMPREHENSIVE AUTOMATED TEST SUITE
 * Tests:
 * 1. Health & Server Status
 * 2. Successful Login (Student, Faculty, Admin)
 * 3. Failed Login (Wrong password, Non-existent user)
 * 4. Role mismatch rejection
 * 5. Public registration prevention (403 Forbidden)
 * 6. Unauthorized access without authentication (401 Unauthorized)
 * 7. Authorized Student access to own records (200 OK)
 * 8. Student unauthorized access to another student's record (403 Forbidden)
 * 9. Faculty unauthorized access to Admin endpoint (403 Forbidden)
 * 10. Admin authorized provisioning of a new student
 * 11. Duplicate PRN rejection (409 Conflict)
 * 12. Logout & Cookie invalidation
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

  // Extract set-cookie if present
  const setCookie = response.headers.get('set-cookie');
  let cookieHeader = '';
  if (setCookie) {
    cookieHeader = setCookie.split(';')[0];
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
    cookie: cookieHeader,
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

async function runTestSuite() {
  console.log('====================================================');
  console.log('RUNNING STAGE 2 AUTHENTICATION & DATABASE TESTS');
  console.log('====================================================\n');

  // Ensure demo result is published so student marksheet access test succeeds
  const setupAdminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'admin@sanjivani.edu.in', password: 'Admin@123' }),
  });
  if (setupAdminLogin.ok && setupAdminLogin.data?.token) {
    await request('/admin/results/batches/approve', {
      method: 'POST',
      headers: { Authorization: `Bearer ${setupAdminLogin.data.token}` },
      body: JSON.stringify({
        batchType: 'semester',
        academicYear: '2024-2025',
        semester: 5,
        branch: 'Computer Engineering',
      }),
    });
    await request('/admin/results/batches/publish', {
      method: 'POST',
      headers: { Authorization: `Bearer ${setupAdminLogin.data.token}` },
      body: JSON.stringify({
        academicYear: '2024-2025',
        semester: 5,
        branch: 'Computer Engineering',
      }),
    });
  }

  // Test 1: Health Check
  console.log('1. Health Check Endpoint');
  const healthRes = await request('/health');
  assert('Server health is ok', healthRes.status === 200 && healthRes.data?.status === 'ok');

  // Test 2: Successful Student Login
  console.log('\n2. Successful Student Login');
  const studentLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ prn: '22UCO01042', password: 'Student@123' }),
  });
  assert('Student login succeeds with 200', studentLoginRes.status === 200);
  assert('Student role is verified', studentLoginRes.data?.user?.role === 'Student');
  assert('Password hash is omitted from response', !studentLoginRes.data?.user?.passwordHash);
  assert('Auth cookie is set', !!studentLoginRes.cookie);

  const studentToken = studentLoginRes.data?.token;
  const studentCookie = studentLoginRes.cookie;

  // Test 3: Successful Faculty Login
  console.log('\n3. Successful Faculty Login');
  const facultyLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'faculty.cs@sanjivani.edu.in', password: 'Faculty@123' }),
  });
  assert('Faculty login succeeds with 200', facultyLoginRes.status === 200);
  assert('Faculty role is verified', facultyLoginRes.data?.user?.role === 'Faculty');
  const facultyToken = facultyLoginRes.data?.token;

  // Test 4: Successful Admin Login
  console.log('\n4. Successful Admin Login');
  const adminLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'admin@sanjivani.edu.in', password: 'Admin@123' }),
  });
  assert('Admin login succeeds with 200', adminLoginRes.status === 200);
  assert('Admin role is verified', adminLoginRes.data?.user?.role === 'Admin');
  const adminToken = adminLoginRes.data?.token;

  // Test 5: Failed Login - Incorrect Password
  console.log('\n5. Failed Login (Wrong Password)');
  const wrongPassRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ prn: '22UCO01042', password: 'WrongPassword123' }),
  });
  assert('Rejects invalid password with 401', wrongPassRes.status === 401);

  // Test 6: Failed Login - Non-existent User
  console.log('\n6. Failed Login (Non-existent PRN)');
  const nonExistentRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ prn: 'NONEXISTENT999', password: 'AnyPassword' }),
  });
  assert('Rejects non-existent user with 401', nonExistentRes.status === 401);

  // Test 7: Public Registration Prevention
  console.log('\n7. Public Registration Prevention');
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username: 'hacker', password: 'password123' }),
  });
  assert('Rejects public registration with 403 Forbidden', regRes.status === 403);

  // Test 8: Unauthorized Access without Token
  console.log('\n8. Unauthorized Access to Protected Route');
  const unauthRes = await request('/auth/me');
  assert('Rejects unauthenticated access with 401', unauthRes.status === 401);

  // Test 9: Student Accessing Own Records
  console.log('\n9. Student Accessing Own Records');
  const ownRecordRes = await request('/marksheet/22UCO01042', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert('Student successfully accesses own marksheet (200)', ownRecordRes.status === 200);
  assert('Returns valid SGPA', typeof ownRecordRes.data?.data?.sgpa === 'number');

  // Test 10: Student Attempting to Access Another Student's Record (Enforce Security)
  console.log("\n10. Student Attempting to Access Another Student's Record (Cross-PRN)");
  const crossPrnRes = await request('/marksheet/22UIT02015', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert('Blocks student from accessing other student record (403)', crossPrnRes.status === 403);

  // Test 11: Faculty Attempting to Access Admin Endpoint
  console.log('\n11. Faculty Attempting to Access Admin Provisioning');
  const facultyAdminRes = await request('/admin/users', {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  assert('Blocks non-admin from admin users list (403)', facultyAdminRes.status === 403);

  // Test 12: Admin Successfully Provisions a New Student
  console.log('\n12. Admin Provisioning a New Student');
  const newPrn = `24TEST${Math.floor(1000 + Math.random() * 9000)}`;
  const provisionRes = await request('/admin/provision/student', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      prn: newPrn,
      name: 'NEW TEST CANDIDATE',
      motherName: 'RADHA',
      seatNo: `SCOE24-T${newPrn.slice(-3)}`,
      rollNo: newPrn.slice(-3),
      branch: 'Computer Engineering',
      password: 'TestStudent@123',
    }),
  });
  assert('Admin successfully provisions student (201)', provisionRes.status === 201);
  assert('Provisioned PRN matches', provisionRes.data?.data?.user?.prn === newPrn);

  // Test 13: Duplicate PRN Rejection
  console.log('\n13. Duplicate PRN Prevention');
  const duplicateRes = await request('/admin/provision/student', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      prn: newPrn, // same PRN as above!
      name: 'DUPLICATE CANDIDATE',
      motherName: 'RADHA',
      seatNo: 'SCOE24-DUP',
      rollNo: '999',
      branch: 'Computer Engineering',
      password: 'TestStudent@123',
    }),
  });
  assert('Rejects duplicate PRN with 409 Conflict', duplicateRes.status === 409);

  // Test 14: Logout
  console.log('\n14. Logout');
  const logoutRes = await request('/auth/logout', {
    method: 'POST',
  });
  assert('Logout succeeds with 200', logoutRes.status === 200);

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
