import mongoose from 'mongoose';

const subjectScoreSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  },
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
    required: true,
    enum: ['TH', 'PR', 'OR', 'TW', 'PE', 'OE'],
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
  },
  earnedCredits: {
    type: Number,
    required: true,
    min: 0,
  },
  internalMarks: {
    type: Number,
    default: null,
  },
  eseMarks: {
    type: Number,
    default: null,
  },
  totalMarks: {
    type: Number,
    default: null,
  },
  grade: {
    type: String,
    required: true,
    enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'],
  },
  gradePoints: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },
  creditPoints: {
    type: Number,
    required: true,
    min: 0,
  },
});

const resultRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: [true, 'Student profile reference is required'],
      index: true,
    },
    prn: {
      type: String,
      required: [true, 'PRN is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    seatNo: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true,
      uppercase: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    motherName: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      required: true,
      trim: true,
    },
    degree: {
      type: String,
      default: 'Bachelor of Technology (B.Tech)',
      trim: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester number is required'],
      min: 1,
      max: 8,
    },
    semesterLabel: {
      type: String,
      default: function () {
        return `Semester ${this.semester}`;
      },
    },
    examinationName: {
      type: String,
      default: 'Winter 2024 Autonomous Examination',
      trim: true,
    },
    subjects: [subjectScoreSchema],
    totalCR: {
      type: Number,
      required: true,
    },
    totalEC: {
      type: Number,
      required: true,
    },
    totalGP: {
      type: Number,
      required: true,
    },
    sgpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    cgpa: {
      type: Number,
      default: null,
      min: 0,
      max: 10,
    },
    resultStatus: {
      type: String,
      required: true,
      default: 'PASS - FIRST CLASS WITH DISTINCTION',
    },
    resultDate: {
      type: String,
      required: true,
      default: '12-01-2025',
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a student has only one result record per academic year and semester
resultRecordSchema.index(
  { prn: 1, academicYear: 1, semester: 1 },
  { unique: true }
);

export const ResultRecord = mongoose.model('ResultRecord', resultRecordSchema);
