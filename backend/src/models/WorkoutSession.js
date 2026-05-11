const mongoose = require("mongoose");

const exerciseTrackingSchema = new mongoose.Schema(
  {
    exerciseName: { type: String, required: true },
    totalSets: { type: Number, required: true },
    completedSetIndexes: [{ type: Number }],
    reps: { type: String, required: true },
    weight: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    muscleGroup: String,
  },
  { _id: false }
);

const workoutSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    day: { type: String, required: true, index: true },
    exercises: [exerciseTrackingSchema],
    completedSets: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0 },
    caloriesBurned: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    startedAt: { type: Date, required: true, index: true },
    finishedAt: { type: Date },
    status: { type: String, enum: ["active", "finished"], default: "active", index: true },
  },
  { timestamps: true }
);

workoutSessionSchema.index({ user: 1, startedAt: -1 });
workoutSessionSchema.index({ user: 1, finishedAt: -1, status: 1 });

module.exports = mongoose.model("WorkoutSession", workoutSessionSchema);
