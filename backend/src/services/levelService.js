const resolveLevel = (xp) => {
  if (xp >= 3000) return "Titan";
  if (xp >= 2000) return "Beast";
  if (xp >= 1000) return "Warrior";
  return "Beginner";
};

module.exports = { resolveLevel };
