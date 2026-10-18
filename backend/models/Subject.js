import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      required: [true, 'Subject / Course code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    subjectName: {
      type: String,
      required: [true, 'Subject / Course name is required'],
      trim: true,
    },
    subjectType: {
      type: String,
      required: [true, 'Course type is required'],
      enum: {
        values: ['TH', 'PR', 'OR', 'TW', 'PE', 'OE'],
        message: '{VALUE} is not a valid course type (Must be TH, PR, OR, TW, PE, or OE)',
      },
      default: 'TH',
    },
    credits: {
      type: Number,
      required: [true, 'Course credits are required'],
      min: 1,
      max: 10,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      default: 'Computer Engineering',
      trim: true,
    },
    maxInternalMarks: {
      type: Number,
      default: 30,
    },
    maxEseMarks: {
      type: Number,
      default: 70,
    },
    totalMaxMarks: {
      type: Number,
      default: 100,
    },
    syllabusRevision: {
      type: String,
      default: 'Autonomous Scheme 2022',
    },
  },
  {
    timestamps: true,
  }
);

export const Subject = mongoose.model('Subject', subjectSchema);
