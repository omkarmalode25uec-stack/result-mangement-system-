import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { FacultyProfile } from '../models/FacultyProfile.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Generate JWT and set it in a secure HTTP-only cookie
 */
const setAuthCookie = (res, user) => {
  const secret = process.env.JWT_SECRET || 'sanjivani_rms_secure_jwt_secret_key_stage2_2025';
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      prn: user.prn || null,
      employeeId: user.employeeId || null,
      username: user.username,
      name: user.name,
    },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: process.env.COOKIE_SAMESITE || (isProduction ? 'none' : 'lax'),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };

  res.cookie(process.env.COOKIE_NAME || 'rms_token', token, cookieOptions);
  return token;
};

/**
 * POST /api/auth/login
 * Handles login for Student (using PRN + password)
 * and Faculty / Admin (using Email/EmployeeId/Username + password)
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, prn, email, password, role } = req.body;

    const loginId = (prn || identifier || email || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifier (PRN, Email, or Username) and Password are required.',
      });
    }

    // Build query criteria based on provided identifier
    const upperId = loginId.toUpperCase();
    const lowerId = loginId.toLowerCase();

    const user = await User.findOne({
      $or: [
        { prn: upperId },
        { username: lowerId },
        { email: lowerId },
        { employeeId: upperId },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    // Optional role check if requested from role-specific tab
    if (role && user.role.toLowerCase() !== role.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: `Account is registered as ${user.role}, not ${role}. Please use the ${user.role} portal.`,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact Examination Cell.',
      });
    }

    // Verify hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Set secure HTTP-only cookie
    const token = setAuthCookie(res, user);

    // Fetch related profile if applicable
    let profile = null;
    if (user.role === 'Student') {
      profile = await StudentProfile.findOne({ user: user._id }).lean();
    } else if (user.role === 'Faculty') {
      profile = await FacultyProfile.findOne({ user: user._id }).lean();
    }

    res.json({
      success: true,
      message: `Welcome, ${user.name}! Login successful.`,
      token, // Also return token in body for clients preferring Authorization header
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        prn: user.prn || null,
        employeeId: user.employeeId || null,
        email: user.email || null,
        profile: profile || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
});

/**
 * POST /api/auth/logout
 * Clears the authentication cookie
 */
router.post('/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(process.env.COOKIE_NAME || 'rms_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: process.env.COOKIE_SAMESITE || (isProduction ? 'none' : 'lax'),
    path: '/',
  });

  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    let profile = null;

    if (req.user.role === 'Student') {
      profile = await StudentProfile.findOne({ user: req.user._id }).lean();
    } else if (req.user.role === 'Faculty') {
      profile = await FacultyProfile.findOne({ user: req.user._id }).lean();
    }

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        role: req.user.role,
        prn: req.user.prn || null,
        employeeId: req.user.employeeId || null,
        email: req.user.email || null,
        lastLogin: req.user.lastLogin,
        profile: profile || null,
      },
    });
  } catch (error) {
    console.error('Auth /me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
    });
  }
});

/**
 * POST /api/auth/register
 * Enforces requirement:
 * "Prevent public registration from granting access to existing student records.
 *  Student accounts must be created or provisioned through an authorized process.
 *  Only admins can create or authorize faculty and admin accounts."
 */
router.post('/register', (req, res) => {
  res.status(403).json({
    success: false,
    message:
      'Public self-registration is strictly disabled for security. Student accounts must be provisioned by the Examination Cell. Faculty and Admin accounts must be authorized by an Administrator.',
  });
});

export default router;
