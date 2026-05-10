const mongoose = require("mongoose");

const analyticsLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["daily", "weekly", "monthly"], required: true, index: true },
    payload: { type: Object, default: {} },
  },
  { timestamps: true }
);

analyticsLogSchema.index({ user: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model("AnalyticsLog", analyticsLogSchema);
