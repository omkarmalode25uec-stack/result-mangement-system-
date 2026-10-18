import mongoose from 'mongoose';

/**
 * AuditLog Model
 * Preserves an immutable audit trail of important academic transitions:
 * - Submissions for review
 * - Reviews & Approvals
 * - Returns for correction with mandatory recorded reasons
 * - Batch Publications & Unpublishing
 * - Post-publication corrections with recorded justifications
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'SUBMITTED_FOR_REVIEW',
        'APPROVED',
        'RETURNED_FOR_CORRECTION',
        'PUBLISHED',
        'UNPUBLISHED',
        'CORRECTED_POST_PUBLICATION',
        'RESULT_CALCULATED',
        'RECALCULATED',
      ],
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['ResultRecord', 'CourseMark', 'ResultBatch', 'GradingScheme'],
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.Mixed,
      index: true,
    },
    batchId: {
      type: String,
      trim: true,
      index: true, // e.g. "2024-2025_SEM5_Computer Engineering"
    },
    academicYear: {
      type: String,
      trim: true,
    },
    semester: {
      type: Number,
    },
    prn: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    courseCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByName: {
      type: String,
      required: true,
      trim: true,
    },
    performedByRole: {
      type: String,
      required: true,
      enum: ['Admin', 'Faculty', 'Student'],
    },
    reason: {
      type: String,
      trim: true,
    },
    gradingSchemeVersion: {
      type: String,
      trim: true,
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed,
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
