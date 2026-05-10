const mongoose = require("mongoose");

const bodyweightEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weight: { type: Number, required: true },
    date: { type: Date, default: Date.now, index: true },
    weeklyProgress: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bodyweightEntrySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("BodyweightEntry", bodyweightEntrySchema);
