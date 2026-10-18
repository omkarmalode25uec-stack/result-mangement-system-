import mongoose from 'mongoose';

const facultyAssignmentSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FacultyProfile',
      required: [true, 'Faculty reference is required'],
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
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
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Revoked'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate assignment of same subject to same faculty in the same term
facultyAssignmentSchema.index(
  { faculty: 1, subject: 1, academicYear: 1, division: 1 },
  { unique: true }
);

export const FacultyAssignment = mongoose.model('FacultyAssignment', facultyAssignmentSchema);
