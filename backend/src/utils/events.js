const EventEmitter = require("events");

class FitnessEventBus extends EventEmitter {}

const eventBus = new FitnessEventBus();

const EVENTS = {
  WORKOUT_PROGRESS_UPDATED: "workout.progress.updated",
  WORKOUT_FINISHED: "workout.finished",
  STREAK_UPDATED: "streak.updated",
};

module.exports = { eventBus, EVENTS };
