import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import apiRouter from './routes/api.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import facultyRouter from './routes/faculty.js';
import resultsRouter from './routes/results.js';
import { seedDatabase } from './utils/seedData.js';

// Resolve current directory for consistent .env resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB & Seed Database
connectDB().then(() => {
  seedDatabase();
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // Crucial for HTTP-only cookies
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for learning & debugging
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Sanjivani College of Engineering - Result Management System (RMS) API',
    institution: "Sanjivani Rural Education Society's Sanjivani College of Engineering, Kopargaon",
    stage: 'Stage 5: Automatic Result Calculation Engine',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        register: 'POST /api/auth/register (restricted)',
      },
      resultsEngine: {
        gradingSchemes: 'GET/POST /api/admin/grading-schemes (Admin only)',
        activeScheme: 'GET /api/admin/grading-schemes/active (Admin only)',
        calculateSemester: 'POST /api/admin/results/calculate-semester (Admin only)',
        recalculateStudent: 'POST /api/admin/results/recalculate/:prn (Admin only)',
        inspectResult: 'GET /api/admin/results/inspect/:prn (Admin only)',
        summary: 'GET /api/admin/results/summary (Admin only)',
      },
      faculty: {
        profile: 'GET /api/faculty/profile (Faculty only)',
        assignments: 'GET /api/faculty/assignments (Faculty only)',
        students: 'GET /api/faculty/courses/:subjectId/students (Faculty only)',
        saveDraft: 'POST /api/faculty/marks/save-draft (Faculty only)',
        submit: 'POST /api/faculty/marks/submit (Faculty only)',
        reopen: 'POST /api/faculty/marks/reopen (Faculty only)',
      },
      admin: {
        provisionStudent: 'POST /api/admin/provision/student (Admin only)',
        provisionFaculty: 'POST /api/admin/provision/faculty (Admin only)',
        provisionAdmin: 'POST /api/admin/provision/admin (Admin only)',
        listUsers: 'GET /api/admin/users (Admin only)',
      },
      public: {
        health: '/api/health',
        collegeInfo: '/api/info',
        publicPreview: '/api/public-preview/:prn',
        stats: '/api/stats',
      },
      protected: {
        studentsList: 'GET /api/students',
        studentByPrn: 'GET /api/students/:prn',
        marksheetByPrn: 'GET /api/marksheet/:prn',
        marksheetMe: 'GET /api/marksheet-me',
        subjects: 'GET /api/subjects',
        sessions: 'GET /api/sessions',
      },
    },
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', resultsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/faculty', facultyRouter);
app.use('/api', apiRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Sanjivani College of Engineering - RMS Backend API`);
  console.log(`Stage 2: Authentication & Database active`);
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Listening on: http://localhost:${PORT}`);
  console.log(`API Health:   http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
