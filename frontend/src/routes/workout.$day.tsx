import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Flame, Timer, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ProgressRing } from "@/components/ProgressRing";
import { RestTimer } from "@/components/RestTimer";
import { SyncBanner } from "@/components/SyncBanner";
import { WORKOUT_PLAN, applyProgression, getProgressionWeek } from "@/lib/workoutPlan";
import { useAppState, useLocalStorage, INITIAL_SETTINGS, type Settings, type WorkoutSession } from "@/lib/storage";
import { apiRequest, hasBackendAuth } from "@/lib/api";

export const Route = createFileRoute("/workout/$day")({
  params: {
    parse: (p) => ({ day: z.string().regex(/^[1-7]$/).parse(p.day) }),
    stringify: (p) => ({ day: String(p.day) }),
  },
  head: ({ params }) => {
    const d = WORKOUT_PLAN[Number(params.day) - 1];
    return { meta: [{ title: `${d?.title ?? "Workout"} - IronPulse AI` }] };
  },
  component: WorkoutPage,
});

function WorkoutPage() {
  const { day } = Route.useParams();
  const dayNum = Number(day);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { state, addSession } = useAppState();
  const [settings] = useLocalStorage<Settings>("ironpulse:settings", INITIAL_SETTINGS);
  const week = getProgressionWeek(state.startDate);

  const baseDay = WORKOUT_PLAN[dayNum - 1];
  if (!baseDay) return null;

  const exercises = useMemo(() => baseDay.exercises.map((e) => applyProgression(e, week)), [baseDay, week]);
  const totalSets = exercises.reduce((a, e) => a + e.sets, 0);
  const [completed, setCompleted] = useLocalStorage<Record<string, boolean>>(
    `ironpulse:progress:${dayNum}:${new Date().toISOString().slice(0, 10)}`,
    {},
  );
  const [expanded, setExpanded] = useState<number | null>(0);
  const [showTimer, setShowTimer] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [saved, setSaved] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
  const startRequestedRef = useRef(false);
  const backendEnabled = hasBackendAuth();
  const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (baseDay.exercises.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="mb-4 text-6xl">Rest</div>
        <h1 className="text-2xl font-bold">Rest Day</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Recovery is when growth happens. Hydrate, sleep, and stretch lightly.
        </p>
        <Link
          to="/"
          className="mt-6 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-glow"
        >
          Back home
        </Link>
      </div>
    );
  }

  const setsDone = Object.values(completed).filter(Boolean).length;
  const progress = setsDone / totalSets;
  const elapsedSec = Math.floor((now - startedAt) / 1000);
  const calories = Math.round(baseDay.estCalories * progress);
  const xpEarned = Math.round(progress * 100 + setsDone * 5);
  const allDone = setsDone === totalSets;

  const startMutation = useMutation({
    mutationFn: async () =>
      apiRequest<{ session: { _id: string } }>("/api/v1/workouts/start", {
        method: "POST",
        body: JSON.stringify({
          day: dayNames[Math.max(0, Math.min(6, dayNum - 1))] || "monday",
          exercises: exercises.map((exercise) => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            muscleGroup: exercise.muscle ?? baseDay.muscles[0] ?? "",
          })),
        }),
      }),
    onSuccess: (res) => setBackendSessionId(res.data.session._id),
    onError: () => setSyncError("Could not start backend session. Local tracking continues."),
  });

  const completeSetMutation = useMutation({
    mutationFn: async (payload: { exerciseName: string; setIndex: number }) => {
      if (!backendSessionId) return null;
      return apiRequest("/api/v1/workouts/complete-set", {
        method: "POST",
        body: JSON.stringify({
          sessionId: backendSessionId,
          exerciseName: payload.exerciseName,
          setIndex: payload.setIndex,
          weight: 0,
        }),
      });
    },
    onError: () => setSyncError("Set sync failed. Workout continues locally."),
  });

  const uncompleteSetMutation = useMutation({
    mutationFn: async (payload: { exerciseName: string; setIndex: number }) => {
      if (!backendSessionId) return null;
      return apiRequest("/api/v1/workouts/uncomplete-set", {
        method: "POST",
        body: JSON.stringify({
          sessionId: backendSessionId,
          exerciseName: payload.exerciseName,
          setIndex: payload.setIndex,
        }),
      });
    },
    onError: () => setSyncError("Undo sync failed. Workout progress may differ until refresh."),
  });

  const finishMutation = useMutation({
    mutationFn: async () => {
      if (!backendSessionId) return null;
      return apiRequest("/api/v1/workouts/finish", {
        method: "POST",
        body: JSON.stringify({ sessionId: backendSessionId }),
      });
    },
    onError: () => setSyncError("Workout saved locally; backend sync will retry next session."),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  useEffect(() => {
    if (backendEnabled && !backendSessionId && !startMutation.isPending && !startRequestedRef.current) {
      startRequestedRef.current = true;
      startMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendEnabled, backendSessionId]);

  const finish = () => {
    if (saved) return navigate({ to: "/" });
    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      day: dayNum,
      title: baseDay.title,
      date: new Date().toISOString(),
      durationSec: elapsedSec,
      setsCompleted: setsDone,
      totalSets,
      calories,
      xp: xpEarned,
      completed: allDone,
    };
    if (backendEnabled && backendSessionId) {
      finishMutation.mutate();
    } else {
      addSession(session);
    }
    setSaved(true);
    setTimeout(() => navigate({ to: "/" }), 800);
  };

  const toggleSet = (key: string) => {
    const [exIdx, setIdx] = key.split("-").map(Number);
    const wasCompleted = !!completed[key];
    const nextCompleted = { ...completed, [key]: !wasCompleted };
    setCompleted(nextCompleted);

    if (!wasCompleted) {
      setShowTimer(true);
      if (backendEnabled) {
        const exerciseName = exercises[exIdx]?.name;
        if (exerciseName) completeSetMutation.mutate({ exerciseName, setIndex: setIdx });
      }
    } else if (backendEnabled) {
      const exerciseName = exercises[exIdx]?.name;
      if (exerciseName) uncompleteSetMutation.mutate({ exerciseName, setIndex: setIdx });
    }
  };

  const mm = Math.floor(elapsedSec / 60).toString().padStart(2, "0");
  const ss = (elapsedSec % 60).toString().padStart(2, "0");

  return (
    <div className={`min-h-screen bg-background ${settings.liveGymMode ? "text-lg" : ""}`}>
      <div className="mx-auto max-w-xl px-5 pb-40 pt-5">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Day {dayNum} · Week {week}</p>
            <h1 className="text-base font-bold">{baseDay.title}</h1>
          </div>
          <button
            onClick={() => setShowTimer(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card active:scale-95"
            aria-label="Rest timer"
          >
            <Timer className="h-5 w-5" />
          </button>
        </div>
        <SyncBanner online={backendEnabled && !!backendSessionId} message={syncError || undefined} />

        <div className="mt-5 flex items-center gap-5 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <ProgressRing progress={progress} size={104} stroke={10}>
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums">{Math.round(progress * 100)}%</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Complete</div>
            </div>
          </ProgressRing>
          <div className="flex-1 space-y-3">
            <Stat icon={<Timer className="h-3.5 w-3.5" />} label="Time" value={`${mm}:${ss}`} />
            <Stat icon={<Flame className="h-3.5 w-3.5" />} label="Calories" value={`${calories}`} />
            <Stat icon={<Trophy className="h-3.5 w-3.5" />} label="Sets" value={`${setsDone}/${totalSets}`} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {baseDay.muscles.map((m) => (
            <span key={m} className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
              {m}
            </span>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {exercises.map((ex, i) => {
            const isOpen = expanded === i;
            const sets = Array.from({ length: ex.sets }, (_, k) => k);
            const exDone = sets.every((k) => completed[`${i}-${k}`]);
            const exCount = sets.filter((k) => completed[`${i}-${k}`]).length;

            return (
              <motion.div
                key={i}
                layout
                className={`overflow-hidden rounded-2xl border transition ${
                  exDone ? "border-success/30 bg-success/10" : "border-border bg-card"
                }`}
              >
                <button onClick={() => setExpanded(isOpen ? null : i)} className="flex w-full items-center gap-3 p-4 text-left">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold tabular-nums ${
                      exDone ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {exDone ? <Check className="h-5 w-5" /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{ex.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ex.description}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {ex.sets} x {ex.reps} · {exCount}/{ex.sets} done
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="px-4 pb-4"
                    >
                      <div className="mb-3 rounded-2xl border border-border/70 bg-background/70 p-3 text-sm text-muted-foreground">
                        {ex.description}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {sets.map((k) => {
                          const key = `${i}-${k}`;
                          const done = !!completed[key];
                          return (
                            <button
                              key={key}
                              onClick={() => toggleSet(key)}
                              disabled={completeSetMutation.isPending || uncompleteSetMutation.isPending}
                              className={`flex h-14 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition active:scale-[0.97] ${
                                done
                                  ? "border-success bg-success text-success-foreground shadow-soft"
                                  : "border-border bg-background text-foreground hover:border-primary/40"
                              }`}
                            >
                              {done && <Check className="h-4 w-4" />}
                              <span>Set {k + 1}</span>
                              <span className="text-xs opacity-70">· {ex.reps}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <button
          onClick={finish}
          className={`mt-6 h-14 w-full rounded-2xl text-base font-semibold shadow-glow transition active:scale-[0.99] ${
            allDone ? "bg-success text-success-foreground" : "gradient-primary text-white"
          }`}
        >
          {saved ? "Saved ✓" : allDone ? "Finish workout" : `Save progress (${setsDone}/${totalSets})`}
        </button>
      </div>

      <div className="pointer-events-none fixed right-3 top-3 z-30 lg:hidden">
        <div className="glass rounded-full p-1.5">
          <ProgressRing progress={progress} size={48} stroke={5}>
            <span className="text-[10px] font-bold tabular-nums">{Math.round(progress * 100)}</span>
          </ProgressRing>
        </div>
      </div>

      {showTimer && <RestTimer seconds={settings.restSeconds} onClose={() => setShowTimer(false)} />}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
