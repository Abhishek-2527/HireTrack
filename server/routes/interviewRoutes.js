const express = require("express");
const { body, param } = require("express-validator");
const {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
  allowedRounds,
  allowedInterviewTypes,
  allowedStatuses,
} = require("../controllers/interviewController");
const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

const validateInterviewFields = [
  body("companyName").trim().notEmpty().withMessage("Company name is required"),
  body("jobTitle").trim().notEmpty().withMessage("Job title is required"),
  body("round").isIn(allowedRounds).withMessage("Interview round is invalid"),
  body("interviewType").isIn(allowedInterviewTypes).withMessage("Interview type is invalid"),
  body("date").notEmpty().isISO8601().withMessage("Interview date must be a valid date"),
  body("startTime")
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("Start time must use 24-hour HH:mm format"),
  body("endTime")
    .optional({ values: "falsy" })
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("End time must use 24-hour HH:mm format")
    .custom((endTime, { req }) => {
      if (endTime && req.body.startTime && endTime <= req.body.startTime) {
        throw new Error("End time must be after the start time");
      }
      return true;
    }),
  body("interviewerEmail")
    .optional({ values: "falsy" })
    .isEmail()
    .withMessage("Please provide a valid interviewer email"),
  body("meetingLink")
    .optional({ values: "falsy" })
    .isURL({ require_protocol: true, protocols: ["http", "https"] })
    .withMessage("Please provide a valid meeting link"),
  body("status").optional().isIn(allowedStatuses).withMessage("Status must be one of the allowed values"),
  body("application")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("Application must be a valid MongoDB ObjectId"),
];

router.use(authMiddleware);

router.post("/", validateInterviewFields, validateRequest, createInterview);
router.get("/", getInterviews);
router.get("/:id", [param("id").isMongoId().withMessage("Invalid interview ID"), validateRequest], getInterviewById);
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid interview ID"),
    ...validateInterviewFields,
    validateRequest,
  ],
  updateInterview
);
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid interview ID"), validateRequest],
  deleteInterview
);

module.exports = router;
