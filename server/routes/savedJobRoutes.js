const express = require("express");
const { body, param } = require("express-validator");
const {
  createSavedJob,
  getSavedJobs,
  getSavedJobById,
  updateSavedJob,
  deleteSavedJob,
  getSavedJobStats,
  convertSavedJobToApplication,
  allowedJobTypes,
  allowedWorkModes,
} = require("../controllers/savedJobController");
const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

const validateSavedJobFields = [
  body("companyName").trim().notEmpty().withMessage("Company name is required"),
  body("jobTitle").trim().notEmpty().withMessage("Job title is required"),
  body("jobType")
    .optional({ values: "falsy" })
    .isIn(allowedJobTypes)
    .withMessage("Job type must be one of Full-time, Part-time, Internship, Contract, Temporary, or Other"),
  body("workMode")
    .optional({ values: "falsy" })
    .isIn(allowedWorkModes)
    .withMessage("Work mode must be Remote, Hybrid, or On-site"),
  body("jobUrl")
    .optional({ values: "falsy" })
    .isURL({ require_protocol: true, allow_underscores: true, protocols: ["http", "https"] })
    .withMessage("Please provide a valid job URL"),
  body("deadline")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Deadline must be a valid date"),
  body("source")
    .optional({ values: "falsy" })
    .trim()
    .isString()
    .withMessage("Source must be a valid string"),
];

router.use(authMiddleware);

router.post("/", validateSavedJobFields, validateRequest, createSavedJob);
router.get("/", getSavedJobs);
router.get("/stats", getSavedJobStats);
router.post(
  "/:id/convert",
  [
    param("id").isMongoId().withMessage("Invalid saved job ID"),
    body("applicationDate").optional().isISO8601().withMessage("Application date must be a valid date"),
    validateRequest,
  ],
  convertSavedJobToApplication
);
router.get("/:id", [param("id").isMongoId().withMessage("Invalid saved job ID"), validateRequest], getSavedJobById);
router.put(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid saved job ID"), ...validateSavedJobFields, validateRequest],
  updateSavedJob
);
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid saved job ID"), validateRequest],
  deleteSavedJob
);

module.exports = router;
