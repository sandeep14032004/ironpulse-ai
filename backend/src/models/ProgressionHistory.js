const mongoose = require("mongoose");

const progressionHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekStart: { type: Date, required: true, index: true },
    consistencyScore: { type: Number, default: 0 },
    repMultiplier: { type: Number, default: 1 },
    setMultiplier: { type: Number, default: 1 },
    plankSecondsBonus: { type: Number, default: 0 },
  },
  { timestamps: true }
);

progressionHistorySchema.index({ user: 1, weekStart: -1 }, { unique: true });

module.exports = mongoose.model("ProgressionHistory", progressionHistorySchema);
