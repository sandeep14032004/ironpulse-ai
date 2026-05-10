const calculateProgression = ({ baseReps, baseSets, consistencyScore }) => ({
  reps: Math.round(baseReps * (1 + consistencyScore * 0.08)),
  sets: Math.max(1, Math.round(baseSets * (1 + consistencyScore * 0.04))),
  plankBonusSeconds: Math.round(10 * consistencyScore),
});

module.exports = { calculateProgression };
