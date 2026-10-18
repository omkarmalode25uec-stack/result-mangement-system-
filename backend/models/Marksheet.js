import mongoose from 'mongoose';

const subjectScoreSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  courseTitle: {
    type: String,
    required: true,
    trim: true,
  },
  courseType: {
    type: String,
    required: true, // e.g. TH, OR, TW, PR, PE, OE
  },
  credits: {
    type: Number,
    required: true, // CR
  },
  earnedCredits: {
    type: Number,
    required: true, // EC
  },
  grade: {
    type: String,
    required: true, // e.g., O, A+, A, B+, B, C, P, F
  },
  gradePoints: {
    type: Number,
    required: true, // GP
  },
  creditPoints: {
    type: Number,
    required: true, // CR * GP
  },
});

const marksheetSchema = new mongoose.Schema(
  {
    prn: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    motherName: {
      type: String,
      required: true,
    },
    seatNo: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    degree: {
      type: String,
      default: 'Bachelor of Technology (B.Tech)',
    },
    academicYear: {
      type: String,
      required: true, // e.g. 2024-2025
    },
    semester: {
      type: String,
      required: true, // e.g. Semester V (Third Year)
    },
    examination: {
      type: String,
      default: 'Winter Session 2024 Examination',
    },
    resultDate: {
      type: String,
      required: true, // e.g. 15-01-2025
    },
    subjects: [subjectScoreSchema],
    totalCR: {
      type: Number,
      required: true, // Total Registered Credits
    },
    totalEC: {
      type: Number,
      required: true, // Total Earned Credits
    },
    totalGP: {
      type: Number,
      required: true, // Total Grade Points
    },
    sgpa: {
      type: Number,
      required: true, // Semester Grade Point Average
    },
    cgpa: {
      type: Number,
      default: null,
    },
    resultStatus: {
      type: String,
      required: true, // e.g., PASS / FIRST CLASS WITH DISTINCTION
    },
    remarks: {
      type: String,
      default: 'Result declared as per autonomous examination ordinances.',
    },
  },
  {
    timestamps: true,
  }
);

export const Marksheet = mongoose.model('Marksheet', marksheetSchema);
