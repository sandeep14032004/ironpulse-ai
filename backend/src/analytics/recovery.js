const buildRecoveryScore = (durationMinutes, completionPercentage) => {
  const durationPenalty = Math.min(30, durationMinutes / 2);
  const completionBoost = completionPercentage / 5;
  return Math.max(40, Math.min(100, Math.round(70 + completionBoost - durationPenalty)));
};

module.exports = { buildRecoveryScore };
