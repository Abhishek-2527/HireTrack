const mongoose = require("mongoose");

const savedJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    duplicateKey: {
      type: String,
      select: false,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      index: true,
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      index: true,
    },
    location: {
      type: String,
      trim: true,
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract", "Temporary", "Other"],
      default: "Other",
      index: true,
    },
    workMode: {
      type: String,
      enum: ["Remote", "Hybrid", "On-site"],
      default: "Remote",
      index: true,
    },
    jobUrl: {
      type: String,
      trim: true,
      validate: {
        validator(value) {
          return !value || /^https?:\/\/.+/.test(value);
        },
        message: "Please provide a valid job URL",
      },
    },
    salary: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },
    isConverted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

savedJobSchema.index({ user: 1, createdAt: -1 });
savedJobSchema.index({ user: 1, deadline: 1 });
savedJobSchema.index(
  { user: 1, duplicateKey: 1 },
  { unique: true, partialFilterExpression: { duplicateKey: { $type: "string" } } }
);

module.exports = mongoose.model("SavedJob", savedJobSchema);
