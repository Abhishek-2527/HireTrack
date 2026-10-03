const mongoose = require("mongoose");
const SavedJob = require("../models/SavedJob");
const Application = require("../models/Application");
const AppError = require("../utils/appError");

const allowedJobTypes = ["Full-time", "Part-time", "Internship", "Contract", "Temporary", "Other"];
const allowedWorkModes = ["Remote", "Hybrid", "On-site"];

const sanitizeSavedJob = (savedJob) => ({
  _id: savedJob._id,
  user: savedJob.user,
  companyName: savedJob.companyName,
  jobTitle: savedJob.jobTitle,
  location: savedJob.location,
  jobType: savedJob.jobType,
  workMode: savedJob.workMode,
  jobUrl: savedJob.jobUrl,
  salary: savedJob.salary,
  deadline: savedJob.deadline,
  notes: savedJob.notes,
  source: savedJob.source,
  isConverted: savedJob.isConverted,
  createdAt: savedJob.createdAt,
  updatedAt: savedJob.updatedAt,
});

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");
const getDuplicateKey = (companyName, jobTitle, jobUrl) =>
  JSON.stringify([
    normalizeText(companyName).toLocaleLowerCase("en"),
    normalizeText(jobTitle).toLocaleLowerCase("en"),
    normalizeText(jobUrl).toLocaleLowerCase("en"),
  ]);

const validateOwnership = async (savedJobId, userId) => {
  if (!savedJobId || !mongoose.Types.ObjectId.isValid(savedJobId)) {
    throw new AppError("Invalid saved job ID", 400);
  }

  const savedJob = await SavedJob.findOne({
    _id: savedJobId,
    user: userId,
  });

  if (!savedJob) {
    throw new AppError("Saved job not found", 404);
  }

  return savedJob;
};

const detectDuplicateSavedJob = async (userId, companyName, jobTitle, jobUrl, excludeId) => {
  const normalizedCompany = normalizeText(companyName);
  const normalizedTitle = normalizeText(jobTitle);
  const normalizedUrl = normalizeText(jobUrl);

  if (!normalizedCompany || !normalizedTitle) {
    return false;
  }

  const duplicateQuery = {
    user: userId,
    companyName: { $regex: `^${escapeRegex(normalizedCompany)}$`, $options: "i" },
    jobTitle: { $regex: `^${escapeRegex(normalizedTitle)}$`, $options: "i" },
  };

  if (excludeId) duplicateQuery._id = { $ne: excludeId };

  if (normalizedUrl) {
    duplicateQuery.jobUrl = { $regex: `^${escapeRegex(normalizedUrl)}$`, $options: "i" };
  } else {
    duplicateQuery.$or = [{ jobUrl: { $exists: false } }, { jobUrl: "" }, { jobUrl: null }];
  }

  const existingSavedJob = await SavedJob.findOne(duplicateQuery);
  return Boolean(existingSavedJob);
};

const createSavedJob = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      user: req.user._id,
    };

    payload.companyName = normalizeText(payload.companyName);
    payload.jobTitle = normalizeText(payload.jobTitle);
    payload.location = normalizeText(payload.location);
    payload.notes = normalizeText(payload.notes);
    payload.source = normalizeText(payload.source);
    payload.salary = normalizeText(payload.salary);

    if (!payload.companyName || !payload.jobTitle) {
      return res.status(400).json({
        success: false,
        message: "Company name and job title are required",
      });
    }

    if (payload.jobUrl) {
      payload.jobUrl = payload.jobUrl.trim();
      if (!/^https?:\/\/.+/.test(payload.jobUrl)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid job URL",
        });
      }
    }

    payload.duplicateKey = getDuplicateKey(payload.companyName, payload.jobTitle, payload.jobUrl);

    if (payload.deadline) {
      const parsedDate = new Date(payload.deadline);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Deadline must be a valid date",
        });
      }
      payload.deadline = parsedDate;
    }

    if (payload.jobType && !allowedJobTypes.includes(payload.jobType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job type",
      });
    }

    if (payload.workMode && !allowedWorkModes.includes(payload.workMode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid work mode",
      });
    }

    const duplicateExists = await detectDuplicateSavedJob(
      req.user._id,
      payload.companyName,
      payload.jobTitle,
      payload.jobUrl
    );

    if (duplicateExists) {
      return res.status(409).json({
        success: false,
        message: "This job is already saved.",
      });
    }

    const savedJob = await SavedJob.create(payload);

    return res.status(201).json({
      success: true,
      data: sanitizeSavedJob(savedJob),
      message: "Saved job created successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "This job is already saved." });
    }

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0]?.message || "Invalid saved job data";
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

    return next(new AppError("Unable to create saved job", 500));
  }
};

const getSavedJobs = async (req, res, next) => {
  try {
    const {
      search = "",
      jobType = "",
      workMode = "",
      source = "",
      isConverted = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = { user: req.user._id };

    if (search) {
      query.$or = [
        { companyName: { $regex: escapeRegex(search), $options: "i" } },
        { jobTitle: { $regex: escapeRegex(search), $options: "i" } },
        { location: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (workMode) {
      query.workMode = workMode;
    }

    if (source) {
      query.source = { $regex: escapeRegex(source), $options: "i" };
    }

    if (isConverted !== "") {
      query.isConverted = isConverted === "true";
    }

    const sortMapping = {
      createdAt: "createdAt",
      companyName: "companyName",
      deadline: "deadline",
      jobTitle: "jobTitle",
    };

    const sortField = sortMapping[sortBy] || "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const requestedPage = Number(page);
    const requestedLimit = Number(limit);
    const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const pageLimit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 1000)
      : 10;
    const skip = (currentPage - 1) * pageLimit;

    const [savedJobs, totalSavedJobs] = await Promise.all([
      SavedJob.find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      SavedJob.countDocuments(query),
    ]);

    const totalPages = Math.max(Math.ceil(totalSavedJobs / pageLimit), 1);

    return res.status(200).json({
      success: true,
      data: savedJobs,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total: totalSavedJobs,
        totalPages,
      },
    });
  } catch (error) {
    return next(new AppError("Unable to fetch saved jobs", 500));
  }
};

const getSavedJobById = async (req, res, next) => {
  try {
    const savedJob = await SavedJob.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!savedJob) {
      return res.status(404).json({
        success: false,
        message: "Saved job not found",
      });
    }

    const convertedApplication = savedJob.isConverted
      ? await Application.findOne({
          user: req.user._id,
          convertedFromSavedJob: savedJob._id,
        }).select("_id").lean()
      : null;

    return res.status(200).json({
      success: true,
      data: {
        ...sanitizeSavedJob(savedJob),
        convertedApplicationId: convertedApplication?._id || null,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(new AppError("Unable to fetch saved job", 500));
  }
};

const updateSavedJob = async (req, res, next) => {
  try {
    const savedJob = await validateOwnership(req.params.id, req.user._id);

    const allowedFields = [
      "companyName",
      "jobTitle",
      "location",
      "jobType",
      "workMode",
      "jobUrl",
      "salary",
      "deadline",
      "notes",
      "source",
    ];

    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key) && req.body[key] !== undefined) {
        savedJob[key] = req.body[key];
      }
    });

    if (savedJob.companyName) {
      savedJob.companyName = normalizeText(savedJob.companyName);
    }

    if (savedJob.jobTitle) {
      savedJob.jobTitle = normalizeText(savedJob.jobTitle);
    }

    if (savedJob.jobUrl) {
      savedJob.jobUrl = savedJob.jobUrl.trim();
      if (!/^https?:\/\/.+/.test(savedJob.jobUrl)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid job URL",
        });
      }
    }

    if (savedJob.deadline) {
      const parsedDate = new Date(savedJob.deadline);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Deadline must be a valid date",
        });
      }
      savedJob.deadline = parsedDate;
    }

    if (savedJob.jobType && !allowedJobTypes.includes(savedJob.jobType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job type",
      });
    }

    if (savedJob.workMode && !allowedWorkModes.includes(savedJob.workMode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid work mode",
      });
    }

    if (!savedJob.companyName || !savedJob.jobTitle) {
      return res.status(400).json({
        success: false,
        message: "Company name and job title are required",
      });
    }

    savedJob.duplicateKey = getDuplicateKey(savedJob.companyName, savedJob.jobTitle, savedJob.jobUrl);
    const duplicateExists = await detectDuplicateSavedJob(
      req.user._id,
      savedJob.companyName,
      savedJob.jobTitle,
      savedJob.jobUrl,
      savedJob._id
    );

    if (duplicateExists) {
      return res.status(409).json({
        success: false,
        message: "This job is already saved.",
      });
    }

    const updatedSavedJob = await savedJob.save();

    return res.status(200).json({
      success: true,
      data: sanitizeSavedJob(updatedSavedJob),
      message: "Saved job updated successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "This job is already saved." });
    }

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0]?.message || "Invalid saved job data";
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

    return next(new AppError("Unable to update saved job", 500));
  }
};

const deleteSavedJob = async (req, res, next) => {
  try {
    const savedJob = await validateOwnership(req.params.id, req.user._id);
    await savedJob.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Saved job deleted successfully",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(new AppError("Unable to delete saved job", 500));
  }
};

const getSavedJobStats = async (req, res, next) => {
  try {
    const utcStartOfToday = new Date();
    utcStartOfToday.setUTCHours(0, 0, 0, 0);

    const stats = await SavedJob.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          converted: { $sum: { $cond: ["$isConverted", 1, 0] } },
          notConverted: { $sum: { $cond: ["$isConverted", 0, 1] } },
          withDeadline: {
            $sum: {
              $cond: [{ $and: [{ $ne: ["$deadline", null] }, { $ne: ["$deadline", ""] }] }, 1, 0],
            },
          },
          expired: {
            $sum: {
              $cond: [{ $and: [{ $ne: ["$deadline", null] }, { $lt: ["$deadline", utcStartOfToday] }] }, 1, 0],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0,
      converted: 0,
      notConverted: 0,
      withDeadline: 0,
      expired: 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        total: result.total || 0,
        converted: result.converted || 0,
        notConverted: result.notConverted || 0,
        withDeadline: result.withDeadline || 0,
        expired: result.expired || 0,
      },
    });
  } catch (error) {
    return next(new AppError("Unable to fetch saved job statistics", 500));
  }
};

const convertSavedJobToApplication = async (req, res, next) => {
  let createdApplication = null;

  try {
    const savedJob = await validateOwnership(req.params.id, req.user._id);

    if (savedJob.isConverted) {
      return res.status(409).json({
        success: false,
        message: "This saved job has already been converted to an application.",
      });
    }

    const { applicationDate } = req.body || {};
    const parsedApplicationDate = applicationDate ? new Date(applicationDate) : new Date();

    if (Number.isNaN(parsedApplicationDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Application date must be a valid date",
      });
    }

    const application = await Application.create({
      user: req.user._id,
      convertedFromSavedJob: savedJob._id,
      companyName: savedJob.companyName,
      jobTitle: savedJob.jobTitle,
      jobType: savedJob.jobType,
      location: savedJob.location,
      workMode: savedJob.workMode,
      applicationDate: parsedApplicationDate,
      status: "Saved",
      salary: savedJob.salary,
      jobUrl: savedJob.jobUrl,
      notes: savedJob.notes,
    });
    createdApplication = application;

    const convertedSavedJob = await SavedJob.findOneAndUpdate(
      { _id: savedJob._id, user: req.user._id, isConverted: { $ne: true } },
      { $set: { isConverted: true } },
      { returnDocument: "after", runValidators: true }
    );

    if (!convertedSavedJob) {
      await Application.deleteOne({
        _id: application._id,
        user: req.user._id,
        convertedFromSavedJob: savedJob._id,
      });
      createdApplication = null;

      return res.status(409).json({
        success: false,
        message: "This saved job has already been converted to an application.",
      });
    }

    createdApplication = null;

    return res.status(201).json({
      success: true,
      data: {
        application,
        savedJob: sanitizeSavedJob(convertedSavedJob),
      },
      message: "Saved job converted to application successfully.",
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.convertedFromSavedJob) {
      return res.status(409).json({
        success: false,
        message: "This saved job has already been converted to an application.",
      });
    }

    if (createdApplication) {
      try {
        await Application.deleteOne({
          _id: createdApplication._id,
          user: req.user._id,
        });
      } catch (rollbackError) {
        console.error("Unable to remove application after saved job conversion failed", rollbackError);
      }
    }

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0]?.message || "Invalid application data";
      return res.status(400).json({ success: false, message });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return next(new AppError("Unable to convert saved job", 500));
  }
};

module.exports = {
  createSavedJob,
  getSavedJobs,
  getSavedJobById,
  updateSavedJob,
  deleteSavedJob,
  getSavedJobStats,
  convertSavedJobToApplication,
  allowedJobTypes,
  allowedWorkModes,
};
