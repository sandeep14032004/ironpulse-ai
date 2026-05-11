export type Exercise = {
  name: string;
  sets: number;
  reps: string;
  type?: "reps" | "time";
  muscle?: string;
  description: string;
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
    emoji: "Power",
    estMinutes: 55,
    estCalories: 380,
    exercises: [
      { name: "Push-Ups", sets: 3, reps: "15", description: "Start in a straight plank with hands just outside shoulder width. Lower your chest toward the floor, keep elbows about 45 degrees from your body, then press back up." },
      { name: "Dumbbell Chest Press", sets: 4, reps: "8-12", description: "Lie on a bench or floor with dumbbells at chest level. Keep feet planted, press the weights upward until arms are straight, then lower with control." },
      { name: "Incline Push-Ups", sets: 3, reps: "12", description: "Place your hands on a bench, chair, or sturdy surface. Keep your body in one line, bring your chest toward the edge, then push away." },
      { name: "Dumbbell Fly", sets: 3, reps: "12", description: "Lie back with a slight bend in your elbows and weights above your chest. Open your arms wide until you feel a chest stretch, then bring the dumbbells back together." },
      { name: "Chair Dips", sets: 3, reps: "12", description: "Place hands on the edge of a chair behind you with legs forward. Lower your hips by bending your elbows, then press up without shrugging your shoulders." },
      { name: "Overhead Dumbbell Extension", sets: 3, reps: "12", description: "Hold one dumbbell overhead with both hands. Keep elbows pointed up, lower the weight behind your head, then extend your arms fully." },
      { name: "Close Push-Ups", sets: 2, reps: "max", description: "Set your hands closer than shoulder width under your chest. Keep elbows tucked near your ribs as you lower and drive back up." },
      { name: "Plank", sets: 3, reps: "40 sec", type: "time", description: "Place forearms under shoulders and keep your body straight from head to heels. Brace your abs and glutes, and avoid letting your hips sag or lift." },
    ],
  },
  {
    day: 2,
    title: "Back + Biceps",
    focus: "Pull Strength",
    muscles: ["Back", "Biceps", "Core"],
    emoji: "Fire",
    estMinutes: 60,
    estCalories: 420,
    exercises: [
      { name: "Dumbbell Rows", sets: 4, reps: "10", description: "Hinge at the hips with a flat back and one hand supported if needed. Pull the dumbbell toward your lower ribs, squeeze your back, then lower slowly." },
      { name: "Barbell Deadlift", sets: 4, reps: "6-8", description: "Stand with feet hip width and bar close to your shins. Brace your core, push the floor away, stand tall, then return the bar by hinging your hips first." },
      { name: "Pull-Ups / Door Rows", sets: 3, reps: "max", description: "For pull-ups, start hanging with shoulders active and pull your chest toward the bar. For door rows, lean back with a straight body and pull your chest toward the handles or support." },
      { name: "Reverse Dumbbell Row", sets: 3, reps: "12", description: "Hinge forward with palms facing out or away depending on your grip. Pull elbows back while keeping your chest proud, then lower with control." },
      { name: "Dumbbell Curls", sets: 3, reps: "12", description: "Stand tall with elbows close to your sides. Curl the weights up without swinging, squeeze your biceps, then lower slowly." },
      { name: "Hammer Curls", sets: 3, reps: "12", description: "Hold dumbbells with palms facing each other. Keep upper arms still, curl the weights to shoulder height, then return under control." },
      { name: "Slow Negative Curls", sets: 2, reps: "10", description: "Lift the dumbbells normally, then take three to five seconds to lower them. Keep your elbows tucked and resist the descent the whole way." },
      { name: "Leg Raises", sets: 3, reps: "15", description: "Lie on your back with legs straight and lower back pressed into the floor. Raise your legs up, then lower them slowly without arching your back." },
    ],
  },
  {
    day: 3,
    title: "Legs",
    focus: "Lower Body Power",
    muscles: ["Quads", "Hamstrings", "Glutes", "Calves"],
    emoji: "Legs",
    estMinutes: 65,
    estCalories: 520,
    exercises: [
      { name: "Barbell / Goblet Squats", sets: 4, reps: "8-10", description: "Stand with feet about shoulder width and toes slightly out. Sit your hips back and down until thighs are at least parallel, then drive through your whole foot to stand." },
      { name: "Dumbbell Squats", sets: 3, reps: "12", description: "Hold dumbbells at your sides or chest and keep your chest lifted. Lower into a squat with knees tracking over toes, then stand tall." },
      { name: "Walking Lunges", sets: 3, reps: "12 each leg", description: "Step forward into a long lunge and lower until both knees bend about 90 degrees. Push through the front heel and bring the back leg through into the next step." },
      { name: "Bulgarian Split Squat", sets: 3, reps: "10 each leg", description: "Place your back foot on a bench behind you and keep most of your weight on the front leg. Drop straight down, then press through the front heel to rise." },
      { name: "Romanian Deadlift", sets: 4, reps: "10", description: "Hold the weight close to your legs with soft knees. Hinge your hips back until you feel your hamstrings load, then squeeze your glutes to stand." },
      { name: "Standing Calf Raises", sets: 4, reps: "20", description: "Stand tall with the balls of your feet on the floor or an edge. Rise up onto your toes as high as you can, pause, then lower slowly." },
      { name: "Mountain Climbers", sets: 3, reps: "20", description: "Start in a strong plank with shoulders over wrists. Drive one knee toward your chest, switch legs quickly, and keep your hips level." },
    ],
  },
  {
    day: 4,
    title: "Shoulders + Abs",
    focus: "Sculpt & Stability",
    muscles: ["Shoulders", "Traps", "Abs"],
    emoji: "Target",
    estMinutes: 55,
    estCalories: 360,
    exercises: [
      { name: "Dumbbell Shoulder Press", sets: 4, reps: "10", description: "Start with dumbbells at shoulder height and palms facing forward or slightly inward. Brace your core, press overhead, then lower back to shoulder level." },
      { name: "Side Lateral Raises", sets: 4, reps: "12", description: "Stand tall with soft elbows and weights by your sides. Raise your arms out until they reach shoulder height, then lower slowly." },
      { name: "Front Raises", sets: 3, reps: "12", description: "Hold dumbbells in front of your thighs. Lift them straight ahead to shoulder height without leaning back, then lower with control." },
      { name: "Rear Delt Raises", sets: 3, reps: "12", description: "Hinge forward with a flat back and arms hanging down. Raise the weights out to the sides, squeezing the back of your shoulders, then lower slowly." },
      { name: "Dumbbell Shrugs", sets: 4, reps: "15", description: "Stand tall with dumbbells at your sides. Lift your shoulders straight up toward your ears, pause briefly, then relax them down." },
      { name: "Plank", sets: 3, reps: "1 min", type: "time", description: "Set your forearms on the floor and keep a long straight line through your body. Brace hard through your core and breathe without letting your hips drop." },
      { name: "Russian Twists", sets: 3, reps: "20", description: "Sit slightly leaned back with your chest up and core tight. Rotate your torso side to side in control, moving from your ribs instead of just swinging your arms." },
      { name: "Leg Raises", sets: 3, reps: "15", description: "Keep your lower back pressed down and raise your legs with control. Lower them slowly and stop before your back lifts off the floor." },
    ],
  },
  {
    day: 5,
    title: "Upper Body Power",
    focus: "Full Upper Strength",
    muscles: ["Chest", "Back", "Shoulders", "Arms"],
    emoji: "Bolt",
    estMinutes: 60,
    estCalories: 440,
    exercises: [
      { name: "Push-Ups", sets: 3, reps: "max", description: "Keep your hands under your shoulders and body rigid like a plank. Lower your chest toward the floor and press up until your elbows are straight." },
      { name: "Dumbbell Chest Press", sets: 3, reps: "10", description: "Lie flat, keep shoulder blades pulled back, and press dumbbells from chest level to full extension. Lower the weights evenly and under control." },
      { name: "Barbell Deadlift", sets: 3, reps: "6", description: "Stand close to the bar, brace your trunk, and drive through the floor to stand. Keep the bar near your body and lower it with a hip hinge." },
      { name: "Dumbbell Rows", sets: 3, reps: "10", description: "Support yourself as needed, keep your back flat, and row the weight toward your hip. Pause at the top and lower without twisting." },
      { name: "Shoulder Press", sets: 3, reps: "10", description: "Hold the weights at shoulder height and keep your ribs down. Press straight overhead and return to the starting position with control." },
      { name: "Dumbbell Curl", sets: 3, reps: "12", description: "Keep elbows close to your body and curl without swinging your torso. Squeeze at the top and lower slowly." },
      { name: "Tricep Dips", sets: 3, reps: "12", description: "Support yourself on parallel bars or a sturdy chair edge. Lower until elbows bend deeply, then press back up while keeping shoulders stable." },
      { name: "Plank", sets: 3, reps: "45 sec", type: "time", description: "Stack shoulders over forearms and hold a straight line from head to heels. Tighten your abs and glutes to stay solid." },
    ],
  },
  {
    day: 6,
    title: "Conditioning",
    focus: "Cardio & Endurance",
    muscles: ["Full Body", "Cardio"],
    emoji: "Run",
    estMinutes: 40,
    estCalories: 480,
    exercises: [
      { name: "Skipping", sets: 1, reps: "5 mins", type: "time", description: "Hold the rope handles low and turn mostly from your wrists. Stay light on your feet, keep your jumps small, and land softly." },
      { name: "Push-Ups", sets: 1, reps: "15", description: "Start in a plank with your core tight. Lower your chest toward the floor and press back up in one smooth line." },
      { name: "Squats", sets: 1, reps: "20", description: "Stand shoulder width, sit your hips back and down, and keep your chest up. Push through the floor to stand all the way back up." },
      { name: "Mountain Climbers", sets: 1, reps: "20", description: "Hold a strong plank and alternate driving knees toward your chest quickly. Keep shoulders over wrists and avoid bouncing your hips." },
      { name: "Dumbbell Swings", sets: 1, reps: "15", description: "Hinge your hips back with the dumbbell between your legs. Snap your hips forward to swing the weight to chest height, then let it fall back into the hinge." },
      { name: "Burpees", sets: 1, reps: "10", description: "Squat down, place hands on the floor, kick feet back, then return forward and stand or jump up. Keep the movement smooth and controlled." },
      { name: "Stretching", sets: 1, reps: "5 mins", type: "time", description: "Move slowly through major muscle groups and breathe deeply. Hold each stretch at a mild tension without bouncing." },
    ],
  },
  {
    day: 7,
    title: "Rest Day",
    focus: "Recovery",
    muscles: ["Recovery"],
    emoji: "Rest",
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
  const js = date.getDay();
  return ((js + 6) % 7) + 1;
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
    if (bonus % 2 === 0) return { ...ex, sets: ex.sets + 1 };
    const m = ex.reps.match(/^(\d+)(?:[-](\d+))?/);
    if (m) {
      if (m[2]) return { ...ex, reps: `${parseInt(m[1], 10) + bonus}-${parseInt(m[2], 10) + bonus}` };
      return { ...ex, reps: `${parseInt(m[1], 10) + bonus * 2}` };
    }
  }
  return ex;
}
