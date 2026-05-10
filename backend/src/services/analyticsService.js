const WorkoutSession = require("../models/WorkoutSession");

const getRange = (days) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { start, end };
};

const getDailyAnalytics = async (userId) => {
  const { start } = getRange(1);
  const stats = await WorkoutSession.aggregate([
    { $match: { user: userId, startedAt: { $gte: start }, status: "finished" } },
    {
      $group: {
        _id: null,
        completedWorkouts: { $sum: 1 },
        setsCompleted: { $sum: "$completedSets" },
        caloriesBurned: { $sum: "$caloriesBurned" },
        duration: { $sum: "$duration" },
        completionScore: { $avg: "$completionPercentage" },
      },
    },
  ]);
  return stats[0] || {
    completedWorkouts: 0, setsCompleted: 0, caloriesBurned: 0, duration: 0, completionScore: 0,
  };
};

const getWeeklyAnalytics = async (userId) => {
  const { start } = getRange(7);
  const sessions = await WorkoutSession.find({
    user: userId,
    startedAt: { $gte: start },
    status: "finished",
  }).lean();
  const totalWorkouts = sessions.length;
  const trainingVolume = sessions.reduce((acc, s) => acc + s.completedSets, 0);
  const strongest = sessions.sort((a, b) => b.caloriesBurned - a.caloriesBurned)[0];
  const muscleGroupFrequency = {};
  sessions.forEach((s) => s.exercises.forEach((e) => {
    muscleGroupFrequency[e.muscleGroup] = (muscleGroupFrequency[e.muscleGroup] || 0) + 1;
  }));
  const avgCompletion = totalWorkouts ? sessions.reduce((a, s) => a + s.completionPercentage, 0) / totalWorkouts : 0;
  const trainingIntensityScore = totalWorkouts ? Math.round((trainingVolume / totalWorkouts) * (avgCompletion / 100)) : 0;
  return {
    totalWorkouts,
    streak: totalWorkouts,
    trainingVolume,
    strongestDay: strongest ? strongest.day : null,
    muscleGroupFrequency,
    trainingIntensityScore,
    workoutAdherence: Math.min(100, Math.round((totalWorkouts / 6) * 100)),
  };
};

const getMonthlyAnalytics = async (userId) => {
  const { start } = getRange(30);
  const sessions = await WorkoutSession.find({ user: userId, startedAt: { $gte: start }, status: "finished" }).lean();
  const heatmap = sessions.map((s) => ({ date: s.startedAt, value: 1 }));
  const muscleDistribution = {};
  sessions.forEach((s) => {
    s.exercises.forEach((e) => {
      muscleDistribution[e.muscleGroup] = (muscleDistribution[e.muscleGroup] || 0) + 1;
    });
  });
  return {
    consistencyHeatmap: heatmap,
    muscleDistribution,
    streakHeatmap: heatmap,
    volumeProgression: sessions.map((s) => ({ date: s.startedAt, completedSets: s.completedSets })),
    progressionTrends: sessions.map((s) => ({ date: s.startedAt, completion: s.completionPercentage })),
    totalGymDays: new Set(sessions.map((s) => new Date(s.startedAt).toDateString())).size,
  };
};

module.exports = { getDailyAnalytics, getWeeklyAnalytics, getMonthlyAnalytics };
