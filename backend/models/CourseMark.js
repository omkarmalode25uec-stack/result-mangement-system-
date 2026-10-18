import mongoose from 'mongoose';

/**
 * CourseMark Model
 * Represents individual course assessment / mark evaluation records submitted by faculty.
 * Implements Stage 4 Faculty Marks Entry workflow with Draft and Submitted states.
 */
const courseMarkSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: [true, 'Student profile reference is required'],
      index: true,
    },
    prn: {
      type: String,
      required: [true, 'Student PRN is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    rollNo: {
      type: String,
      trim: true,
    },
    seatNo: {
      type: String,
      trim: true,
      uppercase: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
      index: true,
    },
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FacultyProfile',
      required: [true, 'Faculty reference is required'],
      index: true,
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
    division: {
      type: String,
      default: 'A',
      trim: true,
    },
    internalMarks: {
      type: Number,
      default: null,
      min: [0, 'Internal marks cannot be negative'],
    },
    eseMarks: {
      type: Number,
      default: null,
      min: [0, 'Final examination (ESE) marks cannot be negative'],
    },
    totalMarks: {
      type: Number,
      default: null,
      min: [0, 'Total marks cannot be negative'],
    },
    maxInternal: {
      type: Number,
      required: true,
      default: 30,
    },
    maxEse: {
      type: Number,
      required: true,
      default: 70,
    },
    totalMax: {
      type: Number,
      required: true,
      default: 100,
    },
    status: {
      type: String,
      enum: {
        values: ['Draft', 'Submitted', 'Approved', 'Rejected'],
        message: '{VALUE} is not a valid evaluation status',
      },
      default: 'Draft',
      index: true,
    },
    attempt: {
      type: Number,
      default: 1,
      min: 1,
    },
    evaluatedBy: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: Prevent duplicate mark records for the same student, subject and examination attempt
courseMarkSchema.index(
  { student: 1, subject: 1, academicYear: 1, semester: 1, attempt: 1 },
  { unique: true }
);

// Secondary lookup index for course roster marks
courseMarkSchema.index({ subject: 1, academicYear: 1, semester: 1, division: 1 });

export const CourseMark = mongoose.model('CourseMark', courseMarkSchema);
