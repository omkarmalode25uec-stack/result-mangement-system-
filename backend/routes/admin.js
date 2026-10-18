import express from 'express';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { FacultyProfile } from '../models/FacultyProfile.js';
import { Department } from '../models/Department.js';
import { AcademicSession } from '../models/AcademicSession.js';
import { Subject } from '../models/Subject.js';
import { FacultyAssignment } from '../models/FacultyAssignment.js';
import { ResultRecord } from '../models/ResultRecord.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Enforce admin-only access for all routes in this file
router.use(authenticate, authorize('Admin'));

// ============================================================================
// 1. STUDENT MANAGEMENT (CRUD, Pagination, Search, Status, CSV Import)
// ============================================================================

/**
 * GET /api/admin/students
 * Paginated, searchable, and filterable list of student records
 */
router.get('/students', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const { search, branch, semester, status } = req.query;
    const filter = {};

    if (branch) filter.branch = branch;
    if (semester) filter.currentSemester = Number(semester);
    if (status) filter.status = status;

    if (search) {
      const q = search.trim();
      filter.$or = [
        { prn: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { seatNo: { $regex: q, $options: 'i' } },
        { rollNo: { $regex: q, $options: 'i' } },
      ];
    }

    const total = await StudentProfile.countDocuments(filter);
    const students = await StudentProfile.find(filter)
      .populate('user', 'username email isActive lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: students.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      limit,
      data: students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/admin/students/:id
 * Get single student profile with user account details
 */
router.get('/students/:id', async (req, res) => {
  try {
    const student = await StudentProfile.findById(req.params.id)
      .populate('user', 'username email isActive lastLogin role')
      .lean();

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    // Also fetch their latest results if any
    const results = await ResultRecord.find({ prn: student.prn }).sort({ semester: -1 }).lean();

    res.json({
      success: true,
      data: {
        ...student,
        results,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/students
 * Create a new student with unique PRN and authorized user credentials
 */
const createStudentHandler = async (req, res) => {
  try {
    const {
      prn,
      name,
      motherName,
      seatNo,
      rollNo,
      branch,
      department,
      academicYear,
      currentSemester,
      email,
      phone,
      password,
    } = req.body;

    if (!prn || !name || !motherName || !seatNo || !password) {
      return res.status(400).json({
        success: false,
        message: 'PRN, Student Name, Mother Name, Seat Number, and Password are required.',
      });
    }

    const cleanPrn = prn.trim().toUpperCase();

    // Check duplicate PRN in User collection
    const existingUser = await User.findOne({ prn: cleanPrn });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `Student account with PRN ${cleanPrn} already exists in database.`,
      });
    }

    // Check duplicate PRN in StudentProfile
    const existingProfile = await StudentProfile.findOne({ prn: cleanPrn });
    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: `Student Profile with PRN ${cleanPrn} already exists.`,
      });
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create User record
    const user = new User({
      username: cleanPrn.toLowerCase(),
      prn: cleanPrn,
      email: email ? email.trim().toLowerCase() : undefined,
      passwordHash,
      role: 'Student',
      name: name.trim(),
    });
    await user.save();

    // Create StudentProfile record
    const profile = new StudentProfile({
      user: user._id,
      prn: cleanPrn,
      name: name.trim(),
      motherName: motherName.trim().toUpperCase(),
      seatNo: seatNo.trim().toUpperCase(),
      rollNo: rollNo ? rollNo.trim() : seatNo.trim(),
      branch: branch ? branch.trim() : 'Computer Engineering',
      department: department ? department.trim() : 'Department of Computer Engineering',
      academicYear: academicYear ? academicYear.trim() : '2024-2025',
      currentSemester: currentSemester ? Number(currentSemester) : 5,
      email: email ? email.trim().toLowerCase() : undefined,
      phone: phone ? phone.trim() : undefined,
      status: 'Active',
    });
    await profile.save();

    res.status(201).json({
      success: true,
      message: `Student account for ${name} (${cleanPrn}) created successfully.`,
      data: {
        ...profile.toObject(),
        user: {
          id: user._id,
          prn: user.prn,
          name: user.name,
          role: user.role,
        },
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.post('/students', createStudentHandler);
router.post('/provision/student', createStudentHandler);

/**
 * PUT /api/admin/students/:id
 * Edit existing student profile
 */
router.put('/students/:id', async (req, res) => {
  try {
    const student = await StudentProfile.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const {
      name,
      motherName,
      seatNo,
      rollNo,
      branch,
      department,
      academicYear,
      currentSemester,
      email,
      phone,
    } = req.body;

    if (name) student.name = name.trim();
    if (motherName) student.motherName = motherName.trim().toUpperCase();
    if (seatNo) student.seatNo = seatNo.trim().toUpperCase();
    if (rollNo) student.rollNo = rollNo.trim();
    if (branch) student.branch = branch.trim();
    if (department) student.department = department.trim();
    if (academicYear) student.academicYear = academicYear.trim();
    if (currentSemester) student.currentSemester = Number(currentSemester);
    if (email !== undefined) student.email = email ? email.trim().toLowerCase() : undefined;
    if (phone !== undefined) student.phone = phone ? phone.trim() : undefined;

    await student.save();

    // Update corresponding user record display name and email if linked
    if (student.user) {
      await User.findByIdAndUpdate(student.user, {
        name: student.name,
        email: student.email,
      });
    }

    res.json({
      success: true,
      message: 'Student record updated successfully.',
      data: student,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/admin/students/:id/status
 * Deactivate or activate student record.
 * Crucial: Preserves all historical results and marksheet records!
 */
router.patch('/students/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // 'Active' | 'Inactive'
    if (!status || !['Active', 'Inactive', 'Deactivated'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Active', 'Inactive', or 'Deactivated'.",
      });
    }

    const student = await StudentProfile.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    student.status = status;
    await student.save();

    // Also toggle linked User isActive
    const isActive = status === 'Active';
    if (student.user) {
      await User.findByIdAndUpdate(student.user, { isActive });
    }

    res.json({
      success: true,
      message: `Student ${student.prn} status updated to ${status}. Historical academic results preserved.`,
      data: {
        id: student._id,
        prn: student.prn,
        status: student.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/students/import-csv
 * Batch import student records from CSV with validation and comprehensive error report
 */
router.post('/students/import-csv', async (req, res) => {
  try {
    const { csvContent } = req.body;

    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'CSV content string is required in request body.',
      });
    }

    const lines = csvContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'CSV must contain a header row and at least one student data row.',
      });
    }

    // Parse header
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const expectedHeaders = ['prn', 'name', 'mothername', 'seatno'];
    const missing = expectedHeaders.filter((h) => !headers.includes(h));

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `CSV header missing required columns: ${missing.join(', ')}. Expected: prn, name, mothername, seatno, rollno, branch, semester, password`,
      });
    }

    const prnIdx = headers.indexOf('prn');
    const nameIdx = headers.indexOf('name');
    const motherIdx = headers.indexOf('mothername');
    const seatIdx = headers.indexOf('seatno');
    const rollIdx = headers.indexOf('rollno');
    const branchIdx = headers.indexOf('branch');
    const semIdx = headers.indexOf('semester');
    const passIdx = headers.indexOf('password');
    const emailIdx = headers.indexOf('email');

    const imported = [];
    const errors = [];
    const seenPrns = new Set();

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      const cols = lines[i].split(',').map((c) => c.trim());

      const rawPrn = cols[prnIdx];
      const rawName = cols[nameIdx];
      const rawMother = cols[motherIdx];
      const rawSeat = cols[seatIdx];
      const rawRoll = rollIdx !== -1 ? cols[rollIdx] : rawSeat;
      const rawBranch = branchIdx !== -1 && cols[branchIdx] ? cols[branchIdx] : 'Computer Engineering';
      const rawSem = semIdx !== -1 && cols[semIdx] ? parseInt(cols[semIdx]) : 5;
      const rawPass = passIdx !== -1 && cols[passIdx] ? cols[passIdx] : 'Student@123';
      const rawEmail = emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx] : null;

      // 1. Check required fields
      if (!rawPrn || !rawName || !rawMother || !rawSeat) {
        errors.push({
          row: rowNum,
          prn: rawPrn || 'UNKNOWN',
          reason: 'Missing one or more required fields (PRN, Name, Mother Name, Seat No).',
        });
        continue;
      }

      const cleanPrn = rawPrn.toUpperCase();

      // 2. Check duplicate within this CSV
      if (seenPrns.has(cleanPrn)) {
        errors.push({
          row: rowNum,
          prn: cleanPrn,
          reason: `Duplicate PRN '${cleanPrn}' detected within this same CSV file.`,
        });
        continue;
      }
      seenPrns.add(cleanPrn);

      // 3. Check duplicate in database
      const existingUser = await User.findOne({ prn: cleanPrn });
      if (existingUser) {
        errors.push({
          row: rowNum,
          prn: cleanPrn,
          reason: `PRN '${cleanPrn}' already exists in database.`,
        });
        continue;
      }

      // 4. Validate semester
      if (isNaN(rawSem) || rawSem < 1 || rawSem > 8) {
        errors.push({
          row: rowNum,
          prn: cleanPrn,
          reason: `Invalid semester '${cols[semIdx]}'. Must be a number between 1 and 8.`,
        });
        continue;
      }

      try {
        // Create user and profile
        const passwordHash = await User.hashPassword(rawPass);
        const user = new User({
          username: cleanPrn.toLowerCase(),
          prn: cleanPrn,
          email: rawEmail ? rawEmail.toLowerCase() : undefined,
          passwordHash,
          role: 'Student',
          name: rawName,
        });
        await user.save();

        const profile = new StudentProfile({
          user: user._id,
          prn: cleanPrn,
          name: rawName,
          motherName: rawMother.toUpperCase(),
          seatNo: rawSeat.toUpperCase(),
          rollNo: rawRoll,
          branch: rawBranch,
          department: `Department of ${rawBranch}`,
          academicYear: '2024-2025',
          currentSemester: rawSem,
          email: rawEmail ? rawEmail.toLowerCase() : undefined,
          status: 'Active',
        });
        await profile.save();

        imported.push({
          row: rowNum,
          prn: cleanPrn,
          name: rawName,
          seatNo: rawSeat.toUpperCase(),
        });
      } catch (insertErr) {
        errors.push({
          row: rowNum,
          prn: cleanPrn,
          reason: insertErr.message,
        });
      }
    }

    res.json({
      success: true,
      totalRows: lines.length - 1,
      importedCount: imported.length,
      failedCount: errors.length,
      imported,
      errors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 2. FACULTY MANAGEMENT (CRUD, Pagination, Search, Status)
// ============================================================================

/**
 * GET /api/admin/faculty
 * Paginated, searchable faculty directory
 */
router.get('/faculty', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const { search, department } = req.query;
    const filter = {};

    if (department) filter.department = department;

    if (search) {
      const q = search.trim();
      filter.$or = [
        { employeeId: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const total = await FacultyProfile.countDocuments(filter);
    const faculty = await FacultyProfile.find(filter)
      .populate('user', 'username email isActive lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: faculty.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      limit,
      data: faculty,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/faculty
 * Create a new faculty member with credentials
 */
const createFacultyHandler = async (req, res) => {
  try {
    const { employeeId, name, department, designation, email, phone, specialization, password } = req.body;

    if (!employeeId || !name || !department || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, Name, Department, Email, and Password are required.',
      });
    }

    const cleanEmpId = employeeId.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate employee ID or email
    const existing = await User.findOne({
      $or: [{ employeeId: cleanEmpId }, { email: cleanEmail }, { username: cleanEmpId.toLowerCase() }],
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Faculty account with this Employee ID or Email already exists.',
      });
    }

    const passwordHash = await User.hashPassword(password);

    const user = new User({
      username: cleanEmpId.toLowerCase(),
      employeeId: cleanEmpId,
      email: cleanEmail,
      passwordHash,
      role: 'Faculty',
      name: name.trim(),
    });
    await user.save();

    const profile = new FacultyProfile({
      user: user._id,
      employeeId: cleanEmpId,
      name: name.trim(),
      department: department.trim(),
      designation: designation ? designation.trim() : 'Associate Professor',
      email: cleanEmail,
      phone: phone ? phone.trim() : undefined,
      specialization: specialization ? specialization.trim() : undefined,
      isActive: true,
    });
    await profile.save();

    res.status(201).json({
      success: true,
      message: `Faculty account for ${name} (${cleanEmpId}) created successfully.`,
      data: {
        ...profile.toObject(),
        user: {
          id: user._id,
          employeeId: user.employeeId,
          name: user.name,
          role: user.role,
        },
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.post('/faculty', createFacultyHandler);
router.post('/provision/faculty', createFacultyHandler);

/**
 * PUT /api/admin/faculty/:id
 * Edit faculty profile details
 */
router.put('/faculty/:id', async (req, res) => {
  try {
    const faculty = await FacultyProfile.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty record not found.' });
    }

    const { name, department, designation, email, phone, specialization } = req.body;

    if (name) faculty.name = name.trim();
    if (department) faculty.department = department.trim();
    if (designation) faculty.designation = designation.trim();
    if (email) faculty.email = email.trim().toLowerCase();
    if (phone !== undefined) faculty.phone = phone ? phone.trim() : undefined;
    if (specialization !== undefined) faculty.specialization = specialization ? specialization.trim() : undefined;

    await faculty.save();

    if (faculty.user) {
      await User.findByIdAndUpdate(faculty.user, {
        name: faculty.name,
        email: faculty.email,
      });
    }

    res.json({
      success: true,
      message: 'Faculty profile updated successfully.',
      data: faculty,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/admin/faculty/:id/status
 * Toggle faculty active/inactive status
 */
router.patch('/faculty/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const faculty = await FacultyProfile.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty record not found.' });
    }

    faculty.isActive = Boolean(isActive);
    await faculty.save();

    if (faculty.user) {
      await User.findByIdAndUpdate(faculty.user, { isActive: faculty.isActive });
    }

    res.json({
      success: true,
      message: `Faculty ${faculty.employeeId} status set to ${faculty.isActive ? 'Active' : 'Inactive'}.`,
      data: faculty,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 3. ACADEMIC STRUCTURE (Departments, Academic Sessions)
// ============================================================================

/**
 * GET /api/admin/departments
 */
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 }).lean();
    res.json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/departments
 */
router.post('/departments', async (req, res) => {
  try {
    const { code, name, hodName } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Department code and name are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Department.findOne({ code: cleanCode });
    if (existing) {
      return res.status(409).json({ success: false, message: `Department code '${cleanCode}' already exists.` });
    }

    const department = await Department.create({
      code: cleanCode,
      name: name.trim(),
      hodName: hodName ? hodName.trim() : 'To be assigned',
    });

    res.status(201).json({ success: true, message: 'Department created successfully.', data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/admin/sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await AcademicSession.find().sort({ academicYear: -1, semester: 1 }).lean();
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/sessions
 */
router.post('/sessions', async (req, res) => {
  try {
    const { academicYear, semester, semesterLabel, term, examinationSession, isCurrent } = req.body;

    if (!academicYear || !semester) {
      return res.status(400).json({ success: false, message: 'Academic Year and Semester number are required.' });
    }

    const semNum = Number(semester);
    if (semNum < 1 || semNum > 8) {
      return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8.' });
    }

    const existing = await AcademicSession.findOne({ academicYear: academicYear.trim(), semester: semNum });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Academic Session for Year '${academicYear}' and Semester ${semNum} already exists.`,
      });
    }

    if (isCurrent) {
      // Unset other sessions as current
      await AcademicSession.updateMany({}, { isCurrent: false });
    }

    const session = await AcademicSession.create({
      academicYear: academicYear.trim(),
      semester: semNum,
      semesterLabel: semesterLabel || `Semester ${semNum}`,
      term: term || (semNum % 2 !== 0 ? 'Odd' : 'Even'),
      examinationSession: examinationSession || `${term || 'Winter'} 2024 Autonomous Exam`,
      isCurrent: Boolean(isCurrent),
    });

    res.status(201).json({ success: true, message: 'Academic session created successfully.', data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 4. SUBJECT MANAGEMENT (CRUD, Validation of credits and mark limits)
// ============================================================================

/**
 * GET /api/admin/subjects
 * Paginated, searchable course catalog
 */
router.get('/subjects', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const { search, semester, department, type } = req.query;
    const filter = {};

    if (semester) filter.semester = Number(semester);
    if (department) filter.department = department;
    if (type) filter.subjectType = type;

    if (search) {
      const q = search.trim();
      filter.$or = [
        { subjectCode: { $regex: q, $options: 'i' } },
        { subjectName: { $regex: q, $options: 'i' } },
      ];
    }

    const total = await Subject.countDocuments(filter);
    const subjects = await Subject.find(filter)
      .sort({ semester: 1, subjectCode: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: subjects.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      limit,
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/subjects
 * Create new subject with strict credit and marks limits validation
 */
router.post('/subjects', async (req, res) => {
  try {
    const {
      subjectCode,
      subjectName,
      subjectType,
      credits,
      semester,
      department,
      maxInternalMarks,
      maxEseMarks,
    } = req.body;

    // 1. Required fields
    if (!subjectCode || !subjectName || !subjectType || credits === undefined || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Course Code, Course Name, Course Type, Credits, and Semester are required.',
      });
    }

    // 2. Validate course type
    const validTypes = ['TH', 'PR', 'OR', 'TW', 'PE', 'OE'];
    if (!validTypes.includes(subjectType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid course type '${subjectType}'. Allowed values: ${validTypes.join(', ')}.`,
      });
    }

    // 3. Validate credit values (Requirement: Prevent invalid credit values)
    const numCredits = Number(credits);
    if (isNaN(numCredits) || numCredits < 1 || numCredits > 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credit value. Course credits must be between 1 and 10.',
      });
    }

    // 4. Validate semester
    const numSemester = Number(semester);
    if (isNaN(numSemester) || numSemester < 1 || numSemester > 8) {
      return res.status(400).json({
        success: false,
        message: 'Invalid semester. Semester must be between 1 and 8.',
      });
    }

    // 5. Validate mark limits (Requirement: Prevent invalid mark limits)
    const internal = maxInternalMarks !== undefined ? Number(maxInternalMarks) : 30;
    const ese = maxEseMarks !== undefined ? Number(maxEseMarks) : 70;

    if (isNaN(internal) || internal < 0 || internal > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid internal mark limit. Must be between 0 and 100.',
      });
    }

    if (isNaN(ese) || ese < 0 || ese > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid final examination mark limit. Must be between 0 and 100.',
      });
    }

    const cleanCode = subjectCode.trim().toUpperCase();

    // 6. Reject duplicate subject codes
    const existing = await Subject.findOne({ subjectCode: cleanCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Subject with code '${cleanCode}' already exists.`,
      });
    }

    const subject = await Subject.create({
      subjectCode: cleanCode,
      subjectName: subjectName.trim(),
      subjectType,
      credits: numCredits,
      semester: numSemester,
      department: department ? department.trim() : 'Computer Engineering',
      maxInternalMarks: internal,
      maxEseMarks: ese,
      totalMaxMarks: internal + ese,
    });

    res.status(201).json({
      success: true,
      message: `Subject '${cleanCode} - ${subjectName}' created successfully.`,
      data: subject,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/admin/subjects/:id
 */
router.put('/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const {
      subjectName,
      subjectType,
      credits,
      semester,
      department,
      maxInternalMarks,
      maxEseMarks,
    } = req.body;

    if (credits !== undefined) {
      const c = Number(credits);
      if (isNaN(c) || c < 1 || c > 10) {
        return res.status(400).json({ success: false, message: 'Credits must be between 1 and 10.' });
      }
      subject.credits = c;
    }

    if (semester !== undefined) {
      const s = Number(semester);
      if (isNaN(s) || s < 1 || s > 8) {
        return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8.' });
      }
      subject.semester = s;
    }

    if (subjectName) subject.subjectName = subjectName.trim();
    if (subjectType) subject.subjectType = subjectType;
    if (department) subject.department = department.trim();

    if (maxInternalMarks !== undefined) {
      const internal = Number(maxInternalMarks);
      if (isNaN(internal) || internal < 0 || internal > 100) {
        return res.status(400).json({ success: false, message: 'Internal marks must be 0-100.' });
      }
      subject.maxInternalMarks = internal;
    }

    if (maxEseMarks !== undefined) {
      const ese = Number(maxEseMarks);
      if (isNaN(ese) || ese < 0 || ese > 100) {
        return res.status(400).json({ success: false, message: 'ESE marks must be 0-100.' });
      }
      subject.maxEseMarks = ese;
    }

    subject.totalMaxMarks = subject.maxInternalMarks + subject.maxEseMarks;
    await subject.save();

    res.json({
      success: true,
      message: 'Subject updated successfully.',
      data: subject,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/admin/subjects/:id
 */
router.delete('/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    // Check if assignments exist
    const hasAssignments = await FacultyAssignment.findOne({ subject: subject._id });
    if (hasAssignments) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete subject while it has active faculty allocations. Remove allocations first.',
      });
    }

    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Subject '${subject.subjectCode}' deleted successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 5. FACULTY-SUBJECT ASSIGNMENTS (Assign faculty members to subjects)
// ============================================================================

/**
 * GET /api/admin/assignments
 * List all faculty course allocations
 */
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await FacultyAssignment.find()
      .populate('faculty', 'employeeId name department designation email')
      .populate('subject', 'subjectCode subjectName subjectType credits semester department')
      .populate('assignedBy', 'name username')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/assignments
 * Assign a faculty member to a subject with validation
 */
router.post('/assignments', async (req, res) => {
  try {
    const { facultyId, subjectId, academicYear, semester, division } = req.body;

    if (!facultyId || !subjectId || !academicYear || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Faculty, Subject, Academic Year, and Semester are required.',
      });
    }

    // 1. Verify faculty exists
    const faculty = await FacultyProfile.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found.' });
    }

    // 2. Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const numSem = Number(semester);
    // 3. Validate semester match
    if (subject.semester !== numSem) {
      return res.status(400).json({
        success: false,
        message: `Subject '${subject.subjectCode}' belongs to Semester ${subject.semester}, but Semester ${numSem} was specified.`,
      });
    }

    const cleanDivision = division ? division.trim().toUpperCase() : 'A';
    const cleanYear = academicYear.trim();

    // 4. Check duplicate assignment (Requirement: Validate semester and subject assignments)
    const existing = await FacultyAssignment.findOne({
      faculty: faculty._id,
      subject: subject._id,
      academicYear: cleanYear,
      division: cleanDivision,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Faculty ${faculty.name} is already assigned to ${subject.subjectCode} (${cleanDivision}) for session ${cleanYear}.`,
      });
    }

    const assignment = await FacultyAssignment.create({
      faculty: faculty._id,
      subject: subject._id,
      academicYear: cleanYear,
      semester: numSem,
      division: cleanDivision,
      assignedBy: req.user._id,
      status: 'Active',
    });

    const populated = await FacultyAssignment.findById(assignment._id)
      .populate('faculty', 'employeeId name department')
      .populate('subject', 'subjectCode subjectName subjectType credits')
      .lean();

    res.status(201).json({
      success: true,
      message: `Assigned ${faculty.name} to ${subject.subjectCode} (${cleanDivision}) successfully.`,
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/admin/assignments/:id
 * Remove / Revoke a faculty assignment
 */
router.delete('/assignments/:id', async (req, res) => {
  try {
    const assignment = await FacultyAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    res.json({
      success: true,
      message: 'Faculty-subject allocation revoked successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 6. SYSTEM METRICS & USER ACCOUNTS (Overview)
// ============================================================================

router.get('/metrics', async (req, res) => {
  try {
    const [totalStudents, totalFaculty, totalSubjects, activeSessions, totalUsers] = await Promise.all([
      StudentProfile.countDocuments(),
      FacultyProfile.countDocuments(),
      Subject.countDocuments(),
      AcademicSession.countDocuments(),
      User.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalFaculty,
        totalSubjects,
        activeSessions,
        totalUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/provision/admin', async (req, res) => {
  try {
    const { username, name, email, password } = req.body;
    if (!username || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, Name, Email, and Password are required for Admin creation.',
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existing = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }],
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Admin account with this Username or Email already exists.',
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = new User({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      role: 'Admin',
      name: name.trim(),
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: `Admin account for ${name} (${cleanUsername}) provisioned successfully.`,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
