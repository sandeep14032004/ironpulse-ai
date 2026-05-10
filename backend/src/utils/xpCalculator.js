const addXpForCompletedSet = () => 10;
const addXpForWorkoutFinish = () => 120;
const addXpForStreakMilestone = (streak) => (streak > 0 && streak % 7 === 0 ? 70 : 0);

module.exports = { addXpForCompletedSet, addXpForWorkoutFinish, addXpForStreakMilestone };
