import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import apiRouter from './routes/api.js';

// Resolve current directory for consistent .env resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
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
    stage: 'Stage 1: Project Setup and UI Foundation',
    endpoints: {
      health: '/api/health',
      collegeInfo: '/api/info',
      studentsList: '/api/students',
      studentByPrn: '/api/students/:prn',
      marksheetByPrn: '/api/marksheet/:prn (Sample PRNs: 22UCO01042, 22UIT02015)',
      stats: '/api/stats',
    },
  });
});

// API Routes
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
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Listening on: http://localhost:${PORT}`);
  console.log(`API Health:   http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
