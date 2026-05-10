const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 6, select: false },
    age: Number,
    height: Number,
    weight: Number,
    targetWeight: Number,
    fitnessGoal: { type: String, default: "general-fitness" },
    xp: { type: Number, default: 0, index: true },
    level: { type: String, default: "Beginner", index: true },
    streak: { type: Number, default: 0 },
    lastWorkoutDate: { type: Date },
    themePreference: { type: String, enum: ["light", "dark"], default: "dark" },
    timerDuration: { type: Number, default: 90 },
    notificationsEnabled: { type: Boolean, default: true },
    preferredUnits: { type: String, enum: ["metric", "imperial"], default: "metric" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function encryptPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
