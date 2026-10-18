import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    prn: {
      type: String,
      required: [true, 'PRN is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    rollNo: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
    },
    seatNo: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Student full name is required'],
      trim: true,
    },
    motherName: {
      type: String,
      required: [true, "Mother's name is required"],
      trim: true,
      uppercase: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    degree: {
      type: String,
      default: 'Bachelor of Technology (B.Tech)',
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      default: 'Department of Computer Engineering',
      trim: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      default: '2024-2025',
      trim: true,
    },
    currentSemester: {
      type: Number,
      required: [true, 'Current semester is required'],
      min: 1,
      max: 8,
      default: 5,
    },
    division: {
      type: String,
      default: 'A',
      trim: true,
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
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Deactivated', 'Graduated', 'Suspended'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

export const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
