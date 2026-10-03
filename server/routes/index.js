const express = require("express");
const { getHealth } = require("../controllers/healthController");
const authRoutes = require("./authRoutes");
const applicationRoutes = require("./applicationRoutes");
const interviewRoutes = require("./interviewRoutes");
const savedJobRoutes = require("./savedJobRoutes");
const analyticsRoutes = require("./analyticsRoutes");

const router = express.Router();

router.get("/health", getHealth);
router.use("/auth", authRoutes);
router.use("/applications", applicationRoutes);
router.use("/interviews", interviewRoutes);
router.use("/saved-jobs", savedJobRoutes);
router.use("/analytics", analyticsRoutes);

module.exports = router;
