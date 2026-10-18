import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * Middleware: authenticate
 * Extracts JWT token from httpOnly cookie or Authorization header.
 * Verifies the token and attaches the authenticated user to `req.user`.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HTTP-only cookie first
    if (req.cookies && req.cookies.rms_token) {
      token = req.cookies.rms_token;
    }
    // 2. Check Authorization header as fallback
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'sanjivani_rms_secure_jwt_secret_key_stage2_2025';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.',
      });
    }

    // Retrieve active user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact Examination Cell.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
    });
  }
};

/**
 * Middleware: authorize(...roles)
 * Enforces role-based access control.
 * Rejects requests with 403 Forbidden if user's role is not authorized.
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role "${req.user.role}" is not authorized for this resource. Required: ${allowedRoles.join(' or ')}.`,
      });
    }

    next();
  };
};

/**
 * Middleware: enforceStudentRecordAccess
 * Prevents a logged-in student from viewing or querying another student's marksheet or data.
 * Faculty and Admins are permitted to inspect student records.
 */
export const enforceStudentRecordAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  // If user is Admin or Faculty, allow access
  if (req.user.role === 'Admin' || req.user.role === 'Faculty') {
    return next();
  }

  // If user is Student, ensure requested PRN matches the logged-in student's PRN
  const requestedPrn = (req.params.prn || req.query.prn || req.body.prn || '').toUpperCase();
  if (requestedPrn && requestedPrn !== req.user.prn?.toUpperCase()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You are only authorized to view your own academic records.',
    });
  }

  next();
};
