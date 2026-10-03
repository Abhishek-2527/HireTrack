const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    convertedFromSavedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SavedJob",
      immutable: true,
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
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract", "Temporary", "Other"],
      required: [true, "Job type is required"],
    },
    location: {
      type: String,
      trim: true,
    },
    workMode: {
      type: String,
      enum: ["Remote", "Hybrid", "On-site"],
      default: "Remote",
    },
    applicationDate: {
      type: Date,
      required: [true, "Application date is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["Saved", "Applied", "Screening", "Interview", "Offer", "Rejected", "Withdrawn"],
      default: "Saved",
      index: true,
    },
    salary: {
      type: String,
      trim: true,
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
    recruiterName: {
      type: String,
      trim: true,
    },
    recruiterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator(value) {
          return !value || /^\S+@\S+\.\S+$/.test(value);
        },
        message: "Please provide a valid recruiter email",
      },
    },
    notes: {
      type: String,
      trim: true,
    },
    followUpDate: {
      type: Date,
    },
    followUpStatus: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ user: 1, status: 1, applicationDate: -1 });
applicationSchema.index({ user: 1, companyName: 1 });
applicationSchema.index({ user: 1, followUpDate: 1, followUpStatus: 1 });
applicationSchema.index({ convertedFromSavedJob: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Application", applicationSchema);
