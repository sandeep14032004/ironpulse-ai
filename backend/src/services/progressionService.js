const ProgressionHistory = require("../models/ProgressionHistory");
const WorkoutSession = require("../models/WorkoutSession");
const { getPlanByDay } = require("./workoutPlanService");

const getWeekStart = (date = new Date()) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const computeConsistencyScore = async (userId) => {
  const weekStart = getWeekStart();
  const sessions = await WorkoutSession.countDocuments({
    user: userId,
    finishedAt: { $gte: weekStart },
    status: "finished",
  });
  return Math.min(1, sessions / 6);
};

const buildProgressionHints = (consistencyScore) => {
  if (consistencyScore >= 0.85) {
    return {
      recommendation: "Increase working weights by 2.5% this week.",
      deloadSuggested: false,
      fatigueDetection: "low-fatigue",
      xpBoostMultiplier: 1.1,
    };
  }
  if (consistencyScore <= 0.35) {
    return {
      recommendation: "Repeat current loads and focus on session adherence.",
      deloadSuggested: true,
      fatigueDetection: "possible-fatigue",
      xpBoostMultiplier: 1,
    };
  }
  return {
    recommendation: "Add 1 rep to top sets where form remains strong.",
    deloadSuggested: false,
    fatigueDetection: "moderate-fatigue",
    xpBoostMultiplier: 1.05,
  };
};

const getCurrentProgression = async (userId, day) => {
  const weekStart = getWeekStart();
  let history = await ProgressionHistory.findOne({ user: userId, weekStart });
  if (!history) {
    const consistency = await computeConsistencyScore(userId);
    history = await ProgressionHistory.create({
      user: userId,
      weekStart,
      consistencyScore: consistency,
      repMultiplier: 1 + consistency * 0.08,
      setMultiplier: 1 + consistency * 0.04,
      plankSecondsBonus: Math.round(10 * consistency),
    });
  }

  const basePlan = getPlanByDay(day);
  const progressedPlan = basePlan.map((ex) => ({
    ...ex,
    reps: Math.round(ex.reps * history.repMultiplier),
    sets: Math.max(1, Math.round(ex.sets * history.setMultiplier)),
    plankSeconds:
      ex.progressionType === "plank" ? 45 + history.plankSecondsBonus : undefined,
  }));

  return { history, progressedPlan, ...buildProgressionHints(history.consistencyScore) };
};

module.exports = { getCurrentProgression, getWeekStart };
