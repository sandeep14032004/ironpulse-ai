const ProgressionHistory = require("../models/ProgressionHistory");
const { getWeekStart } = require("../services/progressionService");

const runWeeklyProgressionJob = async () => {
  const thisWeek = getWeekStart();
  return ProgressionHistory.countDocuments({ weekStart: thisWeek });
};

module.exports = { runWeeklyProgressionJob };
