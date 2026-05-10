const express = require("express");
const authRoutes = require("./authRoutes");
const workoutRoutes = require("./workoutRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const progressionRoutes = require("./progressionRoutes");
const bodyweightRoutes = require("./bodyweightRoutes");
const notificationRoutes = require("./notificationRoutes");
const dashboardRoutes = require("./dashboardRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/workouts", workoutRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/progression", progressionRoutes);
router.use("/bodyweight", bodyweightRoutes);
router.use("/notifications", notificationRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
