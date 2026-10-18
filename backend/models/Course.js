import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true,
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
      enum: ['TH', 'PR', 'OR', 'TW', 'PE', 'OE', 'PRACTICAL', 'THEORY', 'ELECTIVE'],
      default: 'TH',
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    semester: {
      type: Number,
      required: true,
    },
    branch: {
      type: String,
      default: 'Computer Engineering',
    },
  },
  {
    timestamps: true,
  }
);

export const Course = mongoose.model('Course', courseSchema);
