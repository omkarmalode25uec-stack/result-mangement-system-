import mongoose from 'mongoose';

const academicSessionSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      required: [true, 'Academic year is required (e.g., 2024-2025)'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester number is required (1-8)'],
      min: 1,
      max: 8,
    },
    semesterLabel: {
      type: String,
      required: [true, 'Semester label is required (e.g., Semester V)'],
      trim: true,
    },
    term: {
      type: String,
      required: true,
      enum: ['Odd', 'Even'],
      default: 'Odd',
    },
    examinationSession: {
      type: String,
      required: true,
      default: 'Winter 2024 Autonomous Examination',
      trim: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'Evaluated', 'Results Declared', 'Archived'],
      default: 'Results Declared',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring each semester in an academic year is unique
academicSessionSchema.index({ academicYear: 1, semester: 1 }, { unique: true });

export const AcademicSession = mongoose.model('AcademicSession', academicSessionSchema);
