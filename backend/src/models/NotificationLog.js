const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["workout-complete", "streak-milestone", "missed-workout", "progression-week"],
      required: true,
    },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NotificationLog", notificationLogSchema);
