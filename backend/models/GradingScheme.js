import mongoose from 'mongoose';

/**
 * Validates grade boundaries for:
 * 1. Completeness: Covers 0 to 100% without unhandled gaps
 * 2. Non-overlapping: No two grade rules overlap
 * 3. Range sanity: minPercentage <= maxPercentage and valid grade points (0 - 10)
 */
export function validateGradingSchemeRules(rules) {
  if (!Array.isArray(rules) || rules.length < 2) {
    return {
      isValid: false,
      error: 'Grading scheme must contain at least two grade boundaries (passing and failing).',
    };
  }

  // Ensure all required fields exist
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (!r.grade || typeof r.grade !== 'string') {
      return { isValid: false, error: `Rule at index ${i} is missing a valid grade symbol.` };
    }
    if (typeof r.gradePoints !== 'number' || r.gradePoints < 0 || r.gradePoints > 10) {
      return {
        isValid: false,
        error: `Grade "${r.grade}" has invalid grade points (${r.gradePoints}). Must be between 0 and 10.`,
      };
    }
    if (typeof r.minPercentage !== 'number' || r.minPercentage < 0 || r.minPercentage > 100) {
      return {
        isValid: false,
        error: `Grade "${r.grade}" has invalid min percentage (${r.minPercentage}). Must be between 0 and 100.`,
      };
    }
    if (typeof r.maxPercentage !== 'number' || r.maxPercentage < 0 || r.maxPercentage > 100) {
      return {
        isValid: false,
        error: `Grade "${r.grade}" has invalid max percentage (${r.maxPercentage}). Must be between 0 and 100.`,
      };
    }
    if (r.minPercentage > r.maxPercentage) {
      return {
        isValid: false,
        error: `Grade "${r.grade}" has minPercentage (${r.minPercentage}) greater than maxPercentage (${r.maxPercentage}).`,
      };
    }
  }

  // Sort ascending by minPercentage
  const sorted = [...rules].sort((a, b) => a.minPercentage - b.minPercentage);

  // Check bottom boundary covers 0
  if (sorted[0].minPercentage > 0) {
    return {
      isValid: false,
      error: `Grading scheme does not cover the minimum score: lowest grade begins at ${sorted[0].minPercentage}% instead of 0%.`,
    };
  }

  // Check top boundary reaches 100
  if (sorted[sorted.length - 1].maxPercentage < 100) {
    return {
      isValid: false,
      error: `Grading scheme does not cover maximum score: highest grade ends at ${sorted[sorted.length - 1].maxPercentage}% instead of 100%.`,
    };
  }

  // Check for overlaps and gaps
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];

    // Overlap detection
    if (next.minPercentage < curr.maxPercentage) {
      return {
        isValid: false,
        error: `Overlapping grade boundaries detected between "${curr.grade}" (${curr.minPercentage}-${curr.maxPercentage}%) and "${next.grade}" (${next.minPercentage}-${next.maxPercentage}%).`,
      };
    }

    // Gap detection: either exact contiguous (next.min == curr.max) or standard integer interval (next.min == curr.max + 1)
    const gap = next.minPercentage - curr.maxPercentage;
    if (gap > 1.01) {
      return {
        isValid: false,
        error: `Uncovered gap detected in grading scale between "${curr.grade}" (ends at ${curr.maxPercentage}%) and "${next.grade}" (starts at ${next.minPercentage}%).`,
      };
    }
  }

  // Must have at least one failing grade (isPassing: false)
  const hasFailGrade = rules.some((r) => r.isPassing === false || r.grade.toUpperCase() === 'F');
  if (!hasFailGrade) {
    return {
      isValid: false,
      error: 'Grading scheme must designate at least one failing grade (e.g., F with isPassing: false).',
    };
  }

  return { isValid: true };
}

const gradeRuleSchema = new mongoose.Schema({
  grade: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  gradePoints: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },
  minPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  maxPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  isConfirmed: {
    type: Boolean,
    default: false,
    // true for A+=9, A=8, B+=7 confirmed from Sanjivani statement of grades; false for provisional mappings
  },
  description: {
    type: String,
    trim: true,
  },
  isPassing: {
    type: Boolean,
    default: true,
  },
});

const gradingSchemeSchema = new mongoose.Schema(
  {
    schemeName: {
      type: String,
      required: [true, 'Grading scheme name is required'],
      trim: true,
    },
    schemeVersion: {
      type: String,
      required: [true, 'Grading scheme version is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    applicableYears: [
      {
        type: String,
        trim: true,
      },
    ],
    isDefault: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Archived'],
      default: 'Active',
    },
    gradeRules: [gradeRuleSchema],
    passingRequirements: {
      minPassingPercentage: {
        type: Number,
        default: 40,
        min: 0,
        max: 100,
      },
      minEsePassingPercentage: {
        type: Number,
        default: 40,
        min: 0,
        max: 100,
      },
      requireSeparatePassing: {
        type: Boolean,
        default: false,
      },
    },
    subjectCreditRules: {
      allowZeroCreditCourses: {
        type: Boolean,
        default: false,
      },
      auditCoursesEarnZeroCredits: {
        type: Boolean,
        default: true,
      },
    },
    sgpaCalculationMethod: {
      formula: {
        type: String,
        default: 'CREDIT_WEIGHTED_AVERAGE', // Sum(CR_i * GP_i) / Sum(CR_i)
      },
      description: {
        type: String,
        default: 'Sum of (Course Credits * Grade Points) divided by Total Registered Credits',
      },
      isFormulaConfirmed: {
        type: Boolean,
        default: false, // Flagged provisional until verified by official examination ordinance
      },
    },
    roundingConventions: {
      decimalPlaces: {
        type: Number,
        default: 2,
        min: 0,
        max: 4,
      },
      roundingMode: {
        type: String,
        enum: ['HALF_UP', 'TRUNCATE', 'CEIL', 'FLOOR'],
        default: 'HALF_UP',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose Pre-save validation: Reject incomplete, overlapping or invalid grading configurations
gradingSchemeSchema.pre('validate', function () {
  if (this.gradeRules && this.gradeRules.length > 0) {
    const validation = validateGradingSchemeRules(this.gradeRules);
    if (!validation.isValid) {
      throw new Error(`Invalid Grading Scheme Configuration: ${validation.error}`);
    }
  }
});

export const GradingScheme = mongoose.model('GradingScheme', gradingSchemeSchema);
