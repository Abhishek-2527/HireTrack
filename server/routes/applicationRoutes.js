const express = require("express");
const { body, param } = require("express-validator");
const {
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
} = require("../controllers/applicationController");
const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

const validateApplicationFields = [
  body("companyName")
    .trim()
    .notEmpty()
    .withMessage("Company name is required"),
  body("jobTitle")
    .trim()
    .notEmpty()
    .withMessage("Job title is required"),
  body("jobType")
    .isIn(allowedJobTypes)
    .withMessage("Job type must be one of Full-time, Part-time, Internship, Contract, Temporary, or Other"),
  body("workMode")
    .optional()
    .isIn(allowedWorkModes)
    .withMessage("Work mode must be Remote, Hybrid, or On-site"),
  body("applicationDate")
    .notEmpty()
    .withMessage("Application date is required"),
  body("followUpDate")
    .optional({ values: "falsy" })
    .isISO8601({ strict: true })
    .withMessage("Please provide a valid follow-up date"),
  body("status")
    .isIn(allowedStatuses)
    .withMessage("Status must be one of the allowed statuses"),
  body("jobUrl")
    .optional({ values: "falsy" })
    .isURL({ require_protocol: true, protocols: ["http", "https"] })
    .withMessage("Please provide a valid job URL"),
  body("recruiterEmail")
    .optional({ values: "falsy" })
    .isEmail()
    .withMessage("Please provide a valid recruiter email"),
];

router.use(authMiddleware);

router.post("/", validateApplicationFields, validateRequest, createApplication);
router.get("/", getApplications);
router.get("/stats", getApplicationStats);
router.get("/follow-ups", getFollowUps);
router.patch(
  "/:id/follow-up",
  [
    param("id").isMongoId().withMessage("Invalid application ID"),
    body("followUpStatus").isIn(allowedFollowUpStatuses).withMessage("Follow-up status must be Pending or Completed"),
    validateRequest,
  ],
  updateFollowUpStatus
);
router.patch(
  "/:id/status",
  [
    param("id").isMongoId().withMessage("Invalid application ID"),
    body("status").isIn(allowedStatuses).withMessage("Status must be one of the allowed statuses"),
    validateRequest,
  ],
  updateApplicationStatus
);
router.get("/:id", [param("id").isMongoId().withMessage("Invalid application ID"), validateRequest], getApplicationById);
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid application ID"),
    ...validateApplicationFields,
    validateRequest,
  ],
  updateApplication
);
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid application ID"), validateRequest],
  deleteApplication
);

module.exports = router;
