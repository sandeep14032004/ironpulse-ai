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

const recalculateSessionProgress = (session) => {
  const totalSets = session.exercises.reduce((acc, e) => acc + e.totalSets, 0);
  session.completionPercentage = totalSets
    ? Math.round((session.completedSets / totalSets) * 100)
    : 0;
};

const getStartOfToday = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
};

const findTrackableSession = async ({ sessionId, userId }) => {
  if (!sessionId) throw new AppError("Session id is required", 400);

  const session = await WorkoutSession.findOne({ _id: sessionId, user: userId });
  if (!session) throw new AppError("Workout session not found", 404);
  if (session.status === "active") return session;

  const canResumePartialToday =
    session.status === "finished" &&
    session.completionPercentage < 100 &&
    session.startedAt >= getStartOfToday();

  if (!canResumePartialToday) throw new AppError("Workout session is no longer active", 409);

  session.status = "active";
  session.finishedAt = undefined;
  await session.save();
  return session;
};

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
  const incomingExercises = Array.isArray(req.body.exercises) ? req.body.exercises : [];
  const plan = incomingExercises.length
    ? incomingExercises.map((exercise) => ({
        name: exercise.name,
        sets: Number(exercise.sets) || 0,
        reps: String(exercise.reps || ""),
        muscleGroup: exercise.muscleGroup || exercise.muscle || "",
      }))
    : getPlanByDay(day);
  if (!plan.length) throw new AppError("Invalid workout day", 400);

  const existingSession = await WorkoutSession.findOne({
    user: req.user._id,
    day,
    status: "active",
    startedAt: { $gte: getStartOfToday() },
  }).sort({ startedAt: -1 });

  if (existingSession) {
    return res.json(buildSuccess({ message: "Workout resumed", data: { session: existingSession } }));
  }

  const savedPartialSession = await WorkoutSession.findOne({
    user: req.user._id,
    day,
    status: "finished",
    completionPercentage: { $lt: 100 },
    startedAt: { $gte: getStartOfToday() },
  }).sort({ startedAt: -1 });

  if (savedPartialSession) {
    savedPartialSession.status = "active";
    savedPartialSession.finishedAt = undefined;
    await savedPartialSession.save();
    return res.json(buildSuccess({ message: "Workout resumed", data: { session: savedPartialSession } }));
  }

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
  const session = await findTrackableSession({ sessionId, userId: req.user._id });

  const exercise = session.exercises.find((e) => e.exerciseName === exerciseName);
  if (!exercise) throw new AppError("Exercise not found", 404);

  let completedNewSet = false;
  if (!exercise.completedSetIndexes.includes(setIndex)) {
    exercise.completedSetIndexes.push(setIndex);
    exercise.weight = weight;
    session.completedSets += 1;
    completedNewSet = true;
    if (exercise.completedSetIndexes.length >= exercise.totalSets) exercise.completed = true;
  }

  recalculateSessionProgress(session);
  await session.save();

  const user = await User.findById(req.user._id);
  if (completedNewSet) user.xp += addXpForCompletedSet();
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

const uncompleteSet = asyncHandler(async (req, res) => {
  const { sessionId, exerciseName, setIndex } = req.body;
  const session = await findTrackableSession({ sessionId, userId: req.user._id });

  const exercise = session.exercises.find((e) => e.exerciseName === exerciseName);
  if (!exercise) throw new AppError("Exercise not found", 404);

  const existingIndex = exercise.completedSetIndexes.indexOf(setIndex);
  let removedCompletedSet = false;
  if (existingIndex !== -1) {
    exercise.completedSetIndexes.splice(existingIndex, 1);
    session.completedSets = Math.max(0, session.completedSets - 1);
    exercise.completed = exercise.completedSetIndexes.length >= exercise.totalSets;
    removedCompletedSet = true;
  }

  recalculateSessionProgress(session);
  await session.save();

  const user = await User.findById(req.user._id);
  if (removedCompletedSet) user.xp = Math.max(0, user.xp - addXpForCompletedSet());
  user.level = resolveLevel(user.xp);
  await user.save();

  eventBus.emit(EVENTS.WORKOUT_PROGRESS_UPDATED, {
    userId: String(req.user._id),
    sessionId: String(session._id),
    completionPercentage: session.completionPercentage,
  });

  res.json(buildSuccess({
    message: "Set uncompleted",
    data: { session, xp: user.xp, level: user.level, progressRing: session.completionPercentage },
  }));
});

const finishWorkout = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const session = await WorkoutSession.findOne({ _id: sessionId, user: req.user._id, status: "active" });
  if (!session) throw new AppError("Active session not found", 404);

  const savedAt = new Date();
  const finishedAllSets = session.completionPercentage >= 100;
  if (finishedAllSets) {
    session.finishedAt = savedAt;
    session.status = "finished";
  }
  session.duration = Math.max(1, Math.round((savedAt - session.startedAt) / 1000 / 60));
  session.caloriesBurned = Math.round(session.completedSets * 4.8);
  await session.save();

  const user = await User.findById(req.user._id);
  let streak = user.streak;
  if (finishedAllSets) {
    streak = updateStreakOnWorkout(user, session.finishedAt);
    user.xp += addXpForWorkoutFinish() + addXpForStreakMilestone(streak);
  }
  user.level = resolveLevel(user.xp);
  await user.save();

  const recoveryScore = buildRecoveryScore(session.duration, session.completionPercentage);
  if (finishedAllSets) {
    eventBus.emit(EVENTS.WORKOUT_FINISHED, { userId: String(user._id), sessionId: String(session._id) });
    eventBus.emit(EVENTS.STREAK_UPDATED, { userId: String(user._id), streak });
  }

  res.json(buildSuccess({
    message: finishedAllSets ? "Workout finished" : "Workout progress saved",
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

module.exports = {
  getTodayWorkout,
  getWeekWorkout,
  getWorkoutByDay,
  startWorkout,
  completeSet,
  uncompleteSet,
  finishWorkout,
  getWorkoutHistory,
};
