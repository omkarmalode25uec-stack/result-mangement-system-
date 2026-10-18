import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    prn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    rollNo: {
      type: String,
      required: true,
      trim: true,
    },
    seatNo: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
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
    department: {
      type: String,
      default: 'Department of Computer Engineering',
    },
    academicYear: {
      type: String,
      required: true,
      default: '2024-2025',
    },
    currentSemester: {
      type: Number,
      required: true,
      default: 5,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Student = mongoose.model('Student', studentSchema);
