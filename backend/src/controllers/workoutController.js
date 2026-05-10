const WorkoutSession = require("../models/WorkoutSession");
const User = require("../models/User");
const asyncHandler = require("../middlewares/asyncHandler");
const AppError = require("../utils/AppError");
const { buildSuccess } = require("../utils/response");
const { paginate, buildPaginationMeta } = require("../utils/pagination");
const { getDayFromDate, getPlanByDay, getWeekPlan } = require("../services/workoutPlanService");
const { getCurrentProgression } = require("../services/progressionService");
const { updateStreakOnWorkout } = require("../services/streakService");
const { addXpForCompletedSet, addXpForWorkoutFinish, addXpForStreakMilestone } = require("../utils/xpCalculator");
const { resolveLevel } = require("../services/levelService");
const { buildRecoveryScore } = require("../analytics/recovery");
const { eventBus, EVENTS } = require("../utils/events");

const getTodayWorkout = asyncHandler(async (req, res) => {
  const day = getDayFromDate();
  const { progressedPlan } = await getCurrentProgression(req.user._id, day);
  res.json(buildSuccess({ message: "Today workout fetched", data: { day, exercises: progressedPlan } }));
});

const getWeekWorkout = asyncHandler(async (req, res) => {
  res.json(buildSuccess({ message: "Week workout fetched", data: { week: getWeekPlan() } }));
});

const getWorkoutByDay = asyncHandler(async (req, res) => {
  const day = req.params.day.toLowerCase();
  const { progressedPlan } = await getCurrentProgression(req.user._id, day);
  res.json(buildSuccess({ message: "Workout fetched", data: { day, exercises: progressedPlan } }));
});

const startWorkout = asyncHandler(async (req, res) => {
  const day = req.body.day || getDayFromDate();
  const plan = getPlanByDay(day);
  if (!plan.length) throw new AppError("Invalid workout day", 400);

  const session = await WorkoutSession.create({
    user: req.user._id,
    day,
    startedAt: new Date(),
    exercises: plan.map((e) => ({
      exerciseName: e.name,
      totalSets: e.sets,
      reps: e.reps,
      completedSetIndexes: [],
      muscleGroup: e.muscleGroup,
      completed: false,
    })),
  });

  res.status(201).json(buildSuccess({ message: "Workout started", data: { session } }));
});

const completeSet = asyncHandler(async (req, res) => {
  const { sessionId, exerciseName, setIndex, weight = 0 } = req.body;
  const session = await WorkoutSession.findOne({ _id: sessionId, user: req.user._id, status: "active" });
  if (!session) throw new AppError("Active session not found", 404);

  const exercise = session.exercises.find((e) => e.exerciseName === exerciseName);
  if (!exercise) throw new AppError("Exercise not found", 404);

  if (!exercise.completedSetIndexes.includes(setIndex)) {
    exercise.completedSetIndexes.push(setIndex);
    exercise.weight = weight;
    session.completedSets += 1;
    if (exercise.completedSetIndexes.length >= exercise.totalSets) exercise.completed = true;
  }

  const totalSets = session.exercises.reduce((acc, e) => acc + e.totalSets, 0);
  session.completionPercentage = Math.round((session.completedSets / totalSets) * 100);
  await session.save();

  const user = await User.findById(req.user._id);
  user.xp += addXpForCompletedSet();
  user.level = resolveLevel(user.xp);
  await user.save();

  eventBus.emit(EVENTS.WORKOUT_PROGRESS_UPDATED, {
    userId: String(req.user._id),
    sessionId: String(session._id),
    completionPercentage: session.completionPercentage,
  });

  res.json(buildSuccess({
    message: "Set completed",
    data: { session, xp: user.xp, level: user.level, progressRing: session.completionPercentage },
  }));
});

const finishWorkout = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const session = await WorkoutSession.findOne({ _id: sessionId, user: req.user._id, status: "active" });
  if (!session) throw new AppError("Active session not found", 404);

  session.finishedAt = new Date();
  session.status = "finished";
  session.duration = Math.max(1, Math.round((session.finishedAt - session.startedAt) / 1000 / 60));
  session.caloriesBurned = Math.round(session.completedSets * 4.8);
  await session.save();

  const user = await User.findById(req.user._id);
  const streak = updateStreakOnWorkout(user, session.finishedAt);
  user.xp += addXpForWorkoutFinish() + addXpForStreakMilestone(streak);
  user.level = resolveLevel(user.xp);
  await user.save();

  const recoveryScore = buildRecoveryScore(session.duration, session.completionPercentage);
  eventBus.emit(EVENTS.WORKOUT_FINISHED, { userId: String(user._id), sessionId: String(session._id) });
  eventBus.emit(EVENTS.STREAK_UPDATED, { userId: String(user._id), streak });

  res.json(buildSuccess({
    message: "Workout finished",
    data: { session, dashboard: { streak, xp: user.xp, level: user.level, recoveryScore } },
  }));
});

const getWorkoutHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort, dateFilter } = paginate(req.query);
  const filter = { user: req.user._id, status: "finished" };
  if (Object.keys(dateFilter).length) filter.finishedAt = dateFilter;

  const [items, total] = await Promise.all([
    WorkoutSession.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    WorkoutSession.countDocuments(filter),
  ]);

  res.json(buildSuccess({
    message: "Workout history fetched",
    data: { items },
    meta: buildPaginationMeta({ total, page, limit }),
  }));
});

module.exports = { getTodayWorkout, getWeekWorkout, getWorkoutByDay, startWorkout, completeSet, finishWorkout, getWorkoutHistory };
