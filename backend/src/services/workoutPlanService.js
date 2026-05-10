const WEEK_PLAN = {
  monday: [
    { name: "Barbell Bench Press", reps: 8, sets: 4, muscleGroup: "chest", difficulty: "medium", progressionType: "weight" },
    { name: "Incline Dumbbell Press", reps: 10, sets: 3, muscleGroup: "chest", difficulty: "medium", progressionType: "reps" },
    { name: "Triceps Pushdown", reps: 12, sets: 3, muscleGroup: "triceps", difficulty: "easy", progressionType: "reps" },
  ],
  tuesday: [
    { name: "Back Squat", reps: 6, sets: 5, muscleGroup: "legs", difficulty: "hard", progressionType: "weight" },
    { name: "Walking Lunges", reps: 12, sets: 3, muscleGroup: "legs", difficulty: "medium", progressionType: "reps" },
    { name: "Plank", reps: 1, sets: 3, muscleGroup: "core", difficulty: "medium", progressionType: "plank" },
  ],
  wednesday: [
    { name: "Pull Ups", reps: 8, sets: 4, muscleGroup: "back", difficulty: "hard", progressionType: "reps" },
    { name: "Barbell Rows", reps: 10, sets: 4, muscleGroup: "back", difficulty: "medium", progressionType: "weight" },
    { name: "Hammer Curls", reps: 12, sets: 3, muscleGroup: "biceps", difficulty: "easy", progressionType: "reps" },
  ],
  thursday: [
    { name: "Overhead Press", reps: 8, sets: 4, muscleGroup: "shoulders", difficulty: "medium", progressionType: "weight" },
    { name: "Lateral Raises", reps: 15, sets: 3, muscleGroup: "shoulders", difficulty: "easy", progressionType: "reps" },
    { name: "Face Pulls", reps: 15, sets: 3, muscleGroup: "rear-delts", difficulty: "easy", progressionType: "reps" },
  ],
  friday: [
    { name: "Deadlift", reps: 5, sets: 5, muscleGroup: "posterior-chain", difficulty: "hard", progressionType: "weight" },
    { name: "Romanian Deadlift", reps: 8, sets: 4, muscleGroup: "hamstrings", difficulty: "medium", progressionType: "weight" },
    { name: "Hanging Leg Raises", reps: 12, sets: 3, muscleGroup: "core", difficulty: "medium", progressionType: "reps" },
  ],
  saturday: [
    { name: "Push Ups", reps: 20, sets: 4, muscleGroup: "chest", difficulty: "easy", progressionType: "reps" },
    { name: "Bodyweight Squats", reps: 20, sets: 4, muscleGroup: "legs", difficulty: "easy", progressionType: "reps" },
    { name: "Burpees", reps: 12, sets: 4, muscleGroup: "full-body", difficulty: "hard", progressionType: "reps" },
  ],
};

const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const getDayFromDate = (date = new Date()) => {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  return dayName === "sunday" ? "monday" : dayName;
};

const getPlanByDay = (day) => WEEK_PLAN[day.toLowerCase()] || [];
const getWeekPlan = () => WEEK_PLAN;

module.exports = { WEEK_PLAN, dayOrder, getDayFromDate, getPlanByDay, getWeekPlan };
