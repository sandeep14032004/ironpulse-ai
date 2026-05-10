import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
    return { meta: [{ title: `${d?.title ?? "Workout"} — IronPulse AI` }] };
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
  const backendEnabled = hasBackendAuth();
  const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!baseDay) return null;

  if (baseDay.exercises.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4">🌙</div>
        <h1 className="text-2xl font-bold">Rest Day</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">Recovery is when growth happens. Hydrate, sleep, and stretch lightly.</p>
        <Link to="/" className="mt-6 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-glow">Back home</Link>
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
        body: JSON.stringify({ day: dayNames[Math.max(0, Math.min(6, dayNum - 1))] || "monday" }),
      }),
    onSuccess: (res) => setBackendSessionId(res.data.session._id),
    onError: () => setSyncError("Could not start backend session. Local tracking continues."),
  });

  const completeSetMutation = useMutation({
    mutationFn: async (payload: { exerciseName: string; setIndex: number }) => {
      if (!backendSessionId) return null;
      return apiRequest("/api/v1/workouts/complete-set", {
        method: "POST",
        body: JSON.stringify({ sessionId: backendSessionId, exerciseName: payload.exerciseName, setIndex: payload.setIndex, weight: 0 }),
      });
    },
    onError: () => setSyncError("Set sync failed. Workout continues locally."),
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
    if (backendEnabled && !backendSessionId && !startMutation.isPending) {
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
    addSession(session);
    if (backendEnabled) finishMutation.mutate();
    setSaved(true);
    setTimeout(() => navigate({ to: "/" }), 800);
  };

  const toggleSet = (key: string) => {
    const [exIdx, setIdx] = key.split("-").map(Number);
    setCompleted((p) => {
      const next = { ...p, [key]: !p[key] };
      if (!p[key]) {
        setShowTimer(true);
        if (backendEnabled) {
          const exerciseName = exercises[exIdx]?.name;
          if (exerciseName) completeSetMutation.mutate({ exerciseName, setIndex: setIdx });
        }
      }
      return next;
    });
  };

  const mm = Math.floor(elapsedSec / 60).toString().padStart(2, "0");
  const ss = (elapsedSec % 60).toString().padStart(2, "0");

  return (
    <div className={`min-h-screen bg-background ${settings.liveGymMode ? "text-lg" : ""}`}>
      <div className="mx-auto max-w-xl px-5 pt-5 pb-40">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link to="/" className="h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Day {dayNum} · Week {week}</p>
            <h1 className="text-base font-bold">{baseDay.title}</h1>
          </div>
          <button
            onClick={() => setShowTimer(true)}
            className="h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center active:scale-95"
            aria-label="Rest timer"
          >
            <Timer className="h-5 w-5" />
          </button>
        </div>
        <SyncBanner online={backendEnabled && !!backendSessionId} message={syncError || undefined} />

        {/* Progress hero */}
        <div className="mt-5 rounded-3xl bg-card border border-border p-5 shadow-soft flex items-center gap-5">
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

        {/* Muscles */}
        <div className="mt-3 flex flex-wrap gap-2">
          {baseDay.muscles.map((m) => (
            <span key={m} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-accent text-accent-foreground">{m}</span>
          ))}
        </div>

        {/* Exercise list */}
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
                className={`rounded-2xl border overflow-hidden transition ${
                  exDone ? "bg-success/10 border-success/30" : "bg-card border-border"
                }`}
              >
                <button onClick={() => setExpanded(isOpen ? null : i)} className="w-full flex items-center gap-3 p-4 text-left">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold tabular-nums ${
                      exDone ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {exDone ? <Check className="h-5 w-5" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{ex.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {ex.sets} × {ex.reps} · {exCount}/{ex.sets} done
                    </p>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
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
                      <div className="grid grid-cols-2 gap-2">
                        {sets.map((k) => {
                          const key = `${i}-${k}`;
                          const done = !!completed[key];
                          return (
                            <button
                              key={key}
                              onClick={() => toggleSet(key)}
                              disabled={completeSetMutation.isPending}
                              className={`h-14 rounded-xl border font-semibold text-sm transition active:scale-[0.97] flex items-center justify-center gap-2 ${
                                done
                                  ? "bg-success text-success-foreground border-success shadow-soft"
                                  : "bg-background border-border text-foreground hover:border-primary/40"
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

        {/* Finish button */}
        <button
          onClick={finish}
          className={`mt-6 w-full h-14 rounded-2xl font-semibold text-base shadow-glow active:scale-[0.99] transition ${
            allDone ? "bg-success text-success-foreground" : "gradient-primary text-white"
          }`}
        >
          {saved ? "Saved ✓" : allDone ? "Finish workout" : `Save progress (${setsDone}/${totalSets})`}
        </button>
      </div>

      {/* Floating progress ring */}
      <div className="fixed top-3 right-3 z-30 lg:hidden pointer-events-none">
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

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
