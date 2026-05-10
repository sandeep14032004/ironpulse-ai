const asyncHandler = require("../middlewares/asyncHandler");
const WorkoutSession = require("../models/WorkoutSession");
const BodyweightEntry = require("../models/BodyweightEntry");
const { buildSuccess } = require("../utils/response");

const getDashboard = asyncHandler(async (req, res) => {
  const [latestSession, latestWeight] = await Promise.all([
    WorkoutSession.findOne({ user: req.user._id, status: "finished" }).sort({ finishedAt: -1 }).lean(),
    BodyweightEntry.findOne({ user: req.user._id }).sort({ date: -1 }).lean(),
  ]);

  res.json(buildSuccess({
    message: "Dashboard fetched",
    data: {
      user: req.user,
      latestWorkout: latestSession,
      latestWeight,
      leaderboardReady: { xp: req.user.xp, level: req.user.level },
      aiRecommendationReady: {
        lastWorkoutDay: latestSession ? latestSession.day : null,
        preferredGoal: req.user.fitnessGoal,
      },
      gymSessionTimer: { defaultSeconds: req.user.timerDuration || 90 },
    },
  }));
});

module.exports = { getDashboard };
