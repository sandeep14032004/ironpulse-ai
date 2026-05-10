import { useEffect, useState, useCallback } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

export type WorkoutSession = {
  id: string;
  day: number;
  title: string;
  date: string; // ISO
  durationSec: number;
  setsCompleted: number;
  totalSets: number;
  calories: number;
  xp: number;
  completed: boolean;
};

export type WeightEntry = { date: string; weight: number };

export type PR = { exercise: string; value: number; unit: string; date: string };

export type AppState = {
  startDate: string;
  xp: number;
  sessions: WorkoutSession[];
  weights: WeightEntry[];
  prs: PR[];
};

export const INITIAL_STATE: AppState = {
  startDate: new Date().toISOString(),
  xp: 0,
  sessions: [],
  weights: [],
  prs: [],
};

export type Settings = {
  restSeconds: number;
  units: "kg" | "lb";
  notifications: boolean;
  liveGymMode: boolean;
};

export const INITIAL_SETTINGS: Settings = {
  restSeconds: 75,
  units: "kg",
  notifications: true,
  liveGymMode: false,
};

export function useAppState() {
  const [state, setState] = useLocalStorage<AppState>("ironpulse:state", INITIAL_STATE);
  const addSession = useCallback(
    (s: WorkoutSession) =>
      setState((prev) => ({
        ...prev,
        sessions: [...prev.sessions, s],
        xp: prev.xp + s.xp,
      })),
    [setState],
  );
  const addWeight = useCallback(
    (w: WeightEntry) =>
      setState((prev) => ({
        ...prev,
        weights: [...prev.weights.filter((x) => x.date.slice(0, 10) !== w.date.slice(0, 10)), w].sort(
          (a, b) => a.date.localeCompare(b.date),
        ),
      })),
    [setState],
  );
  return { state, setState, addSession, addWeight };
}

export function computeStreak(sessions: WorkoutSession[]) {
  if (!sessions.length) return 0;
  const days = new Set(sessions.filter((s) => s.completed).map((s) => s.date.slice(0, 10)));
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}
