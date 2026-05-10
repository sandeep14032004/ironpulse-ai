const isSameDay = (d1, d2) =>
  d1.toDateString() === d2.toDateString();

const differenceInDays = (a, b) =>
  Math.floor((a - b) / (1000 * 60 * 60 * 24));

const updateStreakOnWorkout = (user, workoutDate = new Date()) => {
  if (!user.lastWorkoutDate) {
    user.streak = 1;
  } else {
    const last = new Date(user.lastWorkoutDate);
    const diff = differenceInDays(workoutDate, last);
    if (isSameDay(workoutDate, last)) {
      return user.streak;
    }
    user.streak = diff === 1 ? user.streak + 1 : 1;
  }
  user.lastWorkoutDate = workoutDate;
  return user.streak;
};

module.exports = { updateStreakOnWorkout };
