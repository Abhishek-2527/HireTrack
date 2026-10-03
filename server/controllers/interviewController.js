const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const Application = require("../models/Application");
const AppError = require("../utils/appError");

const allowedRounds = ["HR", "Technical", "Coding", "Managerial", "System Design", "Final Round", "Other"];
const allowedInterviewTypes = ["Online", "In-person", "Phone", "Video Call"];
const allowedStatuses = ["Scheduled", "Completed", "Rescheduled", "Cancelled"];
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sanitizeInterview = (interview) => ({
  _id: interview._id,
  user: interview.user,
  application: interview.application,
  companyName: interview.companyName,
  jobTitle: interview.jobTitle,
  round: interview.round,
  interviewType: interview.interviewType,
  date: interview.date,
  startTime: interview.startTime,
  endTime: interview.endTime,
  interviewerName: interview.interviewerName,
  interviewerEmail: interview.interviewerEmail,
  meetingLink: interview.meetingLink,
  location: interview.location,
  status: interview.status,
  preparationNotes: interview.preparationNotes,
  feedback: interview.feedback,
  createdAt: interview.createdAt,
  updatedAt: interview.updatedAt,
});

const validateApplicationOwnership = async (applicationId, userId) => {
  if (!applicationId) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    throw new AppError("Invalid application ID", 400);
  }

  const application = await Application.findOne({
    _id: applicationId,
    user: userId,
  });

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  return application;
};

const createInterview = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      user: req.user._id,
    };

    if (payload.application === "") {
      payload.application = null;
    }

    if (payload.application) {
      await validateApplicationOwnership(payload.application, req.user._id);
    }

    const interview = await Interview.create(payload);

    return res.status(201).json({
      success: true,
      data: sanitizeInterview(interview),
      message: "Interview created successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0]?.message || "Invalid interview data";
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(new AppError("Unable to create interview", 500));
  }
};

const getInterviews = async (req, res, next) => {
  try {
    const {
      search = "",
      status = "",
      type = "",
      interviewType = "",
      round = "",
      sortBy = "date",
      sortOrder = "asc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = { user: req.user._id };

    if (type === "upcoming") {
      query.date = { $gte: new Date() };
    }

    if (type === "past") {
      query.date = { $lt: new Date() };
    }

    if (status) {
      query.status = status;
    }

    if (interviewType) {
      query.interviewType = interviewType;
    }

    if (round) {
      query.round = round;
    }

    if (search) {
      query.$or = [
        { companyName: { $regex: escapeRegex(search), $options: "i" } },
        { jobTitle: { $regex: escapeRegex(search), $options: "i" } },
        { interviewerName: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    const sortMapping = {
      date: "date",
      companyName: "companyName",
      status: "status",
      jobTitle: "jobTitle",
    };

    const sortField = sortMapping[sortBy] || "date";
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const requestedPage = Number(page);
    const requestedLimit = Number(limit);
    const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const pageLimit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 1000)
      : 10;
    const skip = (currentPage - 1) * pageLimit;

    const [interviews, totalInterviews] = await Promise.all([
      Interview.find(query)
        .populate({
          path: "application",
          match: { user: req.user._id },
          select: "_id companyName jobTitle",
        })
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      Interview.countDocuments(query),
    ]);

    const totalPages = Math.max(Math.ceil(totalInterviews / pageLimit), 1);

    return res.status(200).json({
      success: true,
      data: interviews,
      pagination: {
        currentPage,
        totalPages,
        totalInterviews,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        pageLimit,
      },
    });
  } catch (error) {
    return next(new AppError("Unable to fetch interviews", 500));
  }
};

const getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate({
      path: "application",
      match: { user: req.user._id },
      select: "_id companyName jobTitle status",
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeInterview(interview),
    });
  } catch (error) {
    return next(new AppError("Unable to fetch interview", 500));
  }
};

const updateInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (req.body.application === "") {
      req.body.application = null;
    }

    if (req.body.application !== undefined && req.body.application !== null) {
      await validateApplicationOwnership(req.body.application, req.user._id);
    }

    const allowedFields = [
      "application",
      "companyName",
      "jobTitle",
      "round",
      "interviewType",
      "date",
      "startTime",
      "endTime",
      "interviewerName",
      "interviewerEmail",
      "meetingLink",
      "location",
      "status",
      "preparationNotes",
      "feedback",
    ];

    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key) && req.body[key] !== undefined) {
        interview[key] = req.body[key];
      }
    });

    const updatedInterview = await interview.save();

    return res.status(200).json({
      success: true,
      data: sanitizeInterview(updatedInterview),
      message: "Interview updated successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0]?.message || "Invalid interview data";
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(new AppError("Unable to update interview", 500));
  }
};

const deleteInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    await interview.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Interview deleted successfully",
    });
  } catch (error) {
    return next(new AppError("Unable to delete interview", 500));
  }
};

module.exports = {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
  allowedRounds,
  allowedInterviewTypes,
  allowedStatuses,
};
