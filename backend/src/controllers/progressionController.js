const asyncHandler = require("../middlewares/asyncHandler");
const { getCurrentProgression } = require("../services/progressionService");
const { getDayFromDate } = require("../services/workoutPlanService");
const { buildSuccess } = require("../utils/response");

const currentProgression = asyncHandler(async (req, res) => {
  const day = getDayFromDate();
  const data = await getCurrentProgression(req.user._id, day);
  res.json(buildSuccess({ message: "Progression fetched", data }));
});

module.exports = { currentProgression };
