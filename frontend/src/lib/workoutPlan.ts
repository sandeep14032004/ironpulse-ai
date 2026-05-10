export type Exercise = {
  name: string;
  sets: number;
  reps: string; // "15", "8-12", "max", "40 sec", "5 mins"
  type?: "reps" | "time";
  muscle?: string;
};

export type WorkoutDay = {
  day: number;
  title: string;
  focus: string;
  muscles: string[];
  emoji: string;
  estMinutes: number;
  estCalories: number;
  exercises: Exercise[];
};

export const WORKOUT_PLAN: WorkoutDay[] = [
  {
    day: 1,
    title: "Chest + Triceps",
    focus: "Push Power",
    muscles: ["Chest", "Triceps", "Core"],
    emoji: "💪",
    estMinutes: 55,
    estCalories: 380,
    exercises: [
      { name: "Push-Ups", sets: 3, reps: "15" },
      { name: "Dumbbell Chest Press", sets: 4, reps: "8–12" },
      { name: "Incline Push-Ups", sets: 3, reps: "12" },
      { name: "Dumbbell Fly", sets: 3, reps: "12" },
      { name: "Chair Dips", sets: 3, reps: "12" },
      { name: "Overhead Dumbbell Extension", sets: 3, reps: "12" },
      { name: "Close Push-Ups", sets: 2, reps: "max" },
      { name: "Plank", sets: 3, reps: "40 sec", type: "time" },
    ],
  },
  {
    day: 2,
    title: "Back + Biceps",
    focus: "Pull Strength",
    muscles: ["Back", "Biceps", "Core"],
    emoji: "🔥",
    estMinutes: 60,
    estCalories: 420,
    exercises: [
      { name: "Dumbbell Rows", sets: 4, reps: "10" },
      { name: "Barbell Deadlift", sets: 4, reps: "6–8" },
      { name: "Pull-Ups / Door Rows", sets: 3, reps: "max" },
      { name: "Reverse Dumbbell Row", sets: 3, reps: "12" },
      { name: "Dumbbell Curls", sets: 3, reps: "12" },
      { name: "Hammer Curls", sets: 3, reps: "12" },
      { name: "Slow Negative Curls", sets: 2, reps: "10" },
      { name: "Leg Raises", sets: 3, reps: "15" },
    ],
  },
  {
    day: 3,
    title: "Legs",
    focus: "Lower Body Power",
    muscles: ["Quads", "Hamstrings", "Glutes", "Calves"],
    emoji: "🦵",
    estMinutes: 65,
    estCalories: 520,
    exercises: [
      { name: "Barbell / Goblet Squats", sets: 4, reps: "8–10" },
      { name: "Dumbbell Squats", sets: 3, reps: "12" },
      { name: "Walking Lunges", sets: 3, reps: "12 each leg" },
      { name: "Bulgarian Split Squat", sets: 3, reps: "10 each leg" },
      { name: "Romanian Deadlift", sets: 4, reps: "10" },
      { name: "Standing Calf Raises", sets: 4, reps: "20" },
      { name: "Mountain Climbers", sets: 3, reps: "20" },
    ],
  },
  {
    day: 4,
    title: "Shoulders + Abs",
    focus: "Sculpt & Stability",
    muscles: ["Shoulders", "Traps", "Abs"],
    emoji: "🎯",
    estMinutes: 55,
    estCalories: 360,
    exercises: [
      { name: "Dumbbell Shoulder Press", sets: 4, reps: "10" },
      { name: "Side Lateral Raises", sets: 4, reps: "12" },
      { name: "Front Raises", sets: 3, reps: "12" },
      { name: "Rear Delt Raises", sets: 3, reps: "12" },
      { name: "Dumbbell Shrugs", sets: 4, reps: "15" },
      { name: "Plank", sets: 3, reps: "1 min", type: "time" },
      { name: "Russian Twists", sets: 3, reps: "20" },
      { name: "Leg Raises", sets: 3, reps: "15" },
    ],
  },
  {
    day: 5,
    title: "Upper Body Power",
    focus: "Full Upper Strength",
    muscles: ["Chest", "Back", "Shoulders", "Arms"],
    emoji: "⚡",
    estMinutes: 60,
    estCalories: 440,
    exercises: [
      { name: "Push-Ups", sets: 3, reps: "max" },
      { name: "Dumbbell Chest Press", sets: 3, reps: "10" },
      { name: "Barbell Deadlift", sets: 3, reps: "6" },
      { name: "Dumbbell Rows", sets: 3, reps: "10" },
      { name: "Shoulder Press", sets: 3, reps: "10" },
      { name: "Dumbbell Curl", sets: 3, reps: "12" },
      { name: "Tricep Dips", sets: 3, reps: "12" },
      { name: "Plank", sets: 3, reps: "45 sec", type: "time" },
    ],
  },
  {
    day: 6,
    title: "Conditioning",
    focus: "Cardio & Endurance",
    muscles: ["Full Body", "Cardio"],
    emoji: "🏃",
    estMinutes: 40,
    estCalories: 480,
    exercises: [
      { name: "Skipping", sets: 1, reps: "5 mins", type: "time" },
      { name: "Push-Ups", sets: 1, reps: "15" },
      { name: "Squats", sets: 1, reps: "20" },
      { name: "Mountain Climbers", sets: 1, reps: "20" },
      { name: "Dumbbell Swings", sets: 1, reps: "15" },
      { name: "Burpees", sets: 1, reps: "10" },
      { name: "Stretching", sets: 1, reps: "5 mins", type: "time" },
    ],
  },
  {
    day: 7,
    title: "Rest Day",
    focus: "Recovery",
    muscles: ["Recovery"],
    emoji: "🌙",
    estMinutes: 0,
    estCalories: 0,
    exercises: [],
  },
];

export const LEVELS = [
  { name: "Beginner", min: 0, color: "oklch(0.65 0.15 220)" },
  { name: "Warrior", min: 500, color: "oklch(0.65 0.18 152)" },
  { name: "Beast", min: 1500, color: "oklch(0.7 0.2 75)" },
  { name: "Titan", min: 3500, color: "oklch(0.65 0.22 25)" },
];

export function getLevel(xp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.min) current = l;
  const next = LEVELS[LEVELS.indexOf(current) + 1];
  return { current, next, progress: next ? (xp - current.min) / (next.min - current.min) : 1 };
}

export const MOTIVATION = [
  "You're stronger than last week.",
  "Consistency builds physiques.",
  "Hydrate now. Your body needs it.",
  "Recovery matters as much as effort.",
  "Push one more rep. You can.",
  "Discipline beats motivation.",
  "Small reps. Big results.",
  "Progress is silent. Keep going.",
];

export function getDayIndex(date = new Date()) {
  // 0 = Mon... 6 = Sun -> map to plan day 1..7
  const js = date.getDay(); // 0 Sun..6 Sat
  return ((js + 6) % 7) + 1; // Mon=1..Sun=7
}

export function getProgressionWeek(startISO: string) {
  const start = new Date(startISO).getTime();
  const now = Date.now();
  return Math.max(1, Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000)) + 1);
}

export function applyProgression(ex: Exercise, week: number): Exercise {
  if (week <= 1) return ex;
  const bonus = week - 1;
  if (ex.type === "time") {
    const m = ex.reps.match(/(\d+)\s*(sec|min|mins)/);
    if (m) {
      const n = parseInt(m[1], 10) + bonus * 5;
      return { ...ex, reps: `${n} ${m[2]}` };
    }
  } else {
    // alternate +1 set vs +2 reps
    if (bonus % 2 === 0) return { ...ex, sets: ex.sets + 1 };
    const m = ex.reps.match(/^(\d+)(?:[–-](\d+))?/);
    if (m) {
      if (m[2]) return { ...ex, reps: `${parseInt(m[1]) + bonus}–${parseInt(m[2]) + bonus}` };
      return { ...ex, reps: `${parseInt(m[1]) + bonus * 2}` };
    }
  }
  return ex;
}
