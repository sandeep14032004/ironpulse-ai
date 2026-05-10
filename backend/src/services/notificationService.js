const NotificationLog = require("../models/NotificationLog");

const messageMap = {
  "workout-complete": [
    "Consistency builds physiques.",
    "Push one more rep next session.",
    "You are stronger than yesterday.",
  ],
  "streak-milestone": [
    "You are stronger than last week.",
    "Your streak is building unstoppable momentum.",
    "Discipline compounds daily.",
  ],
  "missed-workout": [
    "Hydrate now and reset tomorrow.",
    "One missed day is a message, not failure.",
    "Show up tomorrow and reclaim momentum.",
  ],
  "progression-week": [
    "Progressive overload unlocked this week.",
    "Small increases create massive results.",
    "Your consistency earned harder targets.",
  ],
};

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getMotivationalMessage = async (userId, type = "workout-complete") => {
  const message = randomFrom(messageMap[type] || messageMap["workout-complete"]);
  await NotificationLog.create({ user: userId, type, message });
  return message;
};

module.exports = { getMotivationalMessage };
