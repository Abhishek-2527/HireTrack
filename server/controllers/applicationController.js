const Application = require("../models/Application");
const AppError = require("../utils/appError");

const allowedJobTypes = ["Full-time", "Part-time", "Internship", "Contract", "Temporary", "Other"];
const allowedWorkModes = ["Remote", "Hybrid", "On-site"];
const allowedStatuses = ["Saved", "Applied", "Screening", "Interview", "Offer", "Rejected", "Withdrawn"];
const allowedFollowUpStatuses = ["Pending", "Completed"];
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sanitizeApplication = (application) => ({
  _id: application._id,
  user: application.user,
  companyName: application.companyName,
  jobTitle: application.jobTitle,
  jobType: application.jobType,
  location: application.location,
  workMode: application.workMode,
  applicationDate: application.applicationDate,
  status: application.status,
  salary: application.salary,
  jobUrl: application.jobUrl,
  recruiterName: application.recruiterName,
  recruiterEmail: application.recruiterEmail,
  notes: application.notes,
  followUpDate: application.followUpDate,
  followUpStatus: application.followUpStatus || "Pending",
  createdAt: application.createdAt,
  updatedAt: application.updatedAt,
});

const createApplication = async (req, res, next) => {
  try {
    const applicationFields = { ...req.body };
    delete applicationFields.convertedFromSavedJob;
    if (!applicationFields.followUpDate) applicationFields.followUpDate = null;
    applicationFields.followUpStatus = "Pending";
    const payload = {
      ...applicationFields,
      user: req.user._id,
    };

    const application = await Application.create(payload);

    return res.status(201).json({
      success: true,
      data: sanitizeApplication(application),
      message: "Application created successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0]?.message || "Invalid application data";
      return res.status(400).json({
        success: false,
        message,
      });
    }

    return next(new AppError("Unable to create application", 500));
  }
};

const getApplications = async (req, res, next) => {
  try {
    const {
      search = "",
      status = "",
      jobType = "",
      workMode = "",
      sortBy = "applicationDate",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = { user: req.user._id };

    if (search) {
      query.$or = [
        { companyName: { $regex: escapeRegex(search), $options: "i" } },
        { jobTitle: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (workMode) {
      query.workMode = workMode;
    }

    const sortMapping = {
      applicationDate: "applicationDate",
      companyName: "companyName",
      jobTitle: "jobTitle",
      status: "status",
    };

    const sortField = sortMapping[sortBy] || "applicationDate";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const requestedPage = Number(page);
    const requestedLimit = Number(limit);
    const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const pageLimit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 1000)
      : 10;
    const skip = (currentPage - 1) * pageLimit;

    const [applications, totalApplications] = await Promise.all([
      Application.find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      Application.countDocuments(query),
    ]);

    const totalPages = Math.max(Math.ceil(totalApplications / pageLimit), 1);

    return res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        currentPage,
        totalPages,
        totalApplications,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        pageLimit,
      },
    });
  } catch (error) {
    return next(new AppError("Unable to fetch applications", 500));
  }
};

const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeApplication(application),
    });
  } catch (error) {
    return next(new AppError("Unable to fetch application", 500));
  }
};

const getFollowUps = async (req, res, next) => {
  try {
    const applications = await Application.find({
      user: req.user._id,
      followUpDate: { $exists: true, $ne: null },
    }).sort({ followUpDate: 1, companyName: 1 }).lean();
    return res.status(200).json({ success: true, data: applications });
  } catch (error) {
    return next(new AppError("Unable to fetch follow-ups", 500));
  }
};

const updateFollowUpStatus = async (req, res, next) => {
  try {
    const { followUpStatus } = req.body || {};
    if (!allowedFollowUpStatuses.includes(followUpStatus)) {
      return res.status(400).json({ success: false, message: "Follow-up status must be Pending or Completed" });
    }
    const application = await Application.findOne({ _id: req.params.id, user: req.user._id });
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });
    if (!application.followUpDate) {
      return res.status(400).json({ success: false, message: "Add a follow-up date before changing its status" });
    }
    application.followUpStatus = followUpStatus;
    const updatedApplication = await application.save();
    return res.status(200).json({ success: true, data: sanitizeApplication(updatedApplication), message: "Follow-up status updated" });
  } catch (error) {
    return next(new AppError("Unable to update follow-up status", 500));
  }
};

const updateApplication = async (req, res, next) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const allowedFields = [
      "companyName",
      "jobTitle",
      "jobType",
      "location",
      "workMode",
      "applicationDate",
      "status",
      "salary",
      "jobUrl",
      "recruiterName",
      "recruiterEmail",
      "notes",
      "followUpDate",
    ];

    const previousFollowUpDate = application.followUpDate ? new Date(application.followUpDate).toISOString().slice(0, 10) : "";
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key) && req.body[key] !== undefined) {
        application[key] = key === "followUpDate" && !req.body[key] ? null : req.body[key];
      }
    });

    if (
      Object.prototype.hasOwnProperty.call(req.body, "followUpDate") &&
      previousFollowUpDate !== String(req.body.followUpDate || "").slice(0, 10)
    ) {
      application.followUpStatus = "Pending";
    }

    const updatedApplication = await application.save();

    return res.status(200).json({
      success: true,
      data: sanitizeApplication(updatedApplication),
      message: "Application updated successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0]?.message || "Invalid application data";
      return res.status(400).json({
        success: false,
        message,
      });
    }

    return next(new AppError("Unable to update application", 500));
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const application = await Application.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    application.status = status;
    const updatedApplication = await application.save();

    return res.status(200).json({
      success: true,
      data: sanitizeApplication(updatedApplication),
      message: "Application status updated successfully",
    });
  } catch (error) {
    return next(new AppError("Unable to update application status", 500));
  }
};

const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    await application.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    return next(new AppError("Unable to delete application", 500));
  }
};

const getApplicationStats = async (req, res, next) => {
  try {
    const stats = await Application.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const counts = {
      total: 0,
      saved: 0,
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
    };

    stats.forEach((item) => {
      const key = String(item._id).toLowerCase();
      counts.total += item.count;
      if (key === "saved") counts.saved = item.count;
      if (key === "applied") counts.applied = item.count;
      if (key === "screening") counts.screening = item.count;
      if (key === "interview") counts.interview = item.count;
      if (key === "offer") counts.offer = item.count;
      if (key === "rejected") counts.rejected = item.count;
      if (key === "withdrawn") counts.withdrawn = item.count;
    });

    return res.status(200).json({
      success: true,
      data: counts,
    });
  } catch (error) {
    return next(new AppError("Unable to fetch application statistics", 500));
  }
};

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  getApplicationStats,
  getFollowUps,
  updateFollowUpStatus,
  allowedJobTypes,
  allowedWorkModes,
  allowedStatuses,
  allowedFollowUpStatuses,
};
