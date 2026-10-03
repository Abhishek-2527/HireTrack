const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
      index: true,
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
    round: {
      type: String,
      enum: ["HR", "Technical", "Coding", "Managerial", "System Design", "Final Round", "Other"],
      required: [true, "Interview round is required"],
      index: true,
    },
    interviewType: {
      type: String,
      enum: ["Online", "In-person", "Phone", "Video Call"],
      required: [true, "Interview type is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Interview date is required"],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
      default: "",
    },
    interviewerName: {
      type: String,
      trim: true,
      default: "",
    },
    interviewerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      validate: {
        validator(value) {
          return !value || /^\S+@\S+\.\S+$/.test(value);
        },
        message: "Please provide a valid interviewer email",
      },
    },
    meetingLink: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator(value) {
          return !value || /^https?:\/\/.+/.test(value);
        },
        message: "Please provide a valid meeting link",
      },
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Rescheduled", "Cancelled"],
      default: "Scheduled",
      index: true,
    },
    preparationNotes: {
      type: String,
      trim: true,
      default: "",
    },
    feedback: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

interviewSchema.index({ user: 1, date: 1 });
interviewSchema.index({ user: 1, status: 1 });
interviewSchema.index({ user: 1, application: 1 });

module.exports = mongoose.model("Interview", interviewSchema);
