import express from 'express';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { FacultyProfile } from '../models/FacultyProfile.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Enforce admin-only access for all routes in this file
router.use(authenticate, authorize('Admin'));

/**
 * POST /api/admin/provision/student
 * Authorized provisioning of a student account and profile
 */
router.post('/provision/student', async (req, res) => {
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
      password,
    } = req.body;

    // Validation
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
        message: `Student account with PRN ${cleanPrn} already exists.`,
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
    });
    await profile.save();

    res.status(201).json({
      success: true,
      message: `Student account for ${name} (${cleanPrn}) provisioned successfully.`,
      data: {
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
    console.error('Provision student error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to provision student account.',
    });
  }
});

/**
 * POST /api/admin/provision/faculty
 * Authorized provisioning of a faculty account and profile
 */
router.post('/provision/faculty', async (req, res) => {
  try {
    const { employeeId, name, department, designation, email, phone, password } = req.body;

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
    });
    await profile.save();

    res.status(201).json({
      success: true,
      message: `Faculty account for ${name} (${cleanEmpId}) provisioned successfully.`,
      data: {
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
    console.error('Provision faculty error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to provision faculty account.',
    });
  }
});

/**
 * POST /api/admin/provision/admin
 * Authorized provisioning of an additional Admin account
 */
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
    console.error('Provision admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to provision admin account.',
    });
  }
});

/**
 * GET /api/admin/users
 * Returns list of all system user accounts (passwords excluded)
 */
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const query = {};
    if (role) {
      query.role = role;
    }

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
