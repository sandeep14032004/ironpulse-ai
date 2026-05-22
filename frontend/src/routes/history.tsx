import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { SyncBanner } from "@/components/SyncBanner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Calendar,
  ChevronDown,
  Clock3,
  Dumbbell,
  Flame,
  Plus,
  Scale,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { apiRequest, hasBackendAuth } from "@/lib/api";

type RemoteWorkoutExercise = {
  exerciseName: string;
  totalSets: number;
  completedSetIndexes?: number[];
  reps?: string;
  weight?: number;
  completed?: boolean;
  muscleGroup?: string;
};

type RemoteWorkoutSession = {
  _id: string;
  day: string;
  startedAt: string;
  finishedAt?: string;
  duration: number;
  completedSets: number;
  caloriesBurned?: number;
  completionPercentage?: number;
  exercises: RemoteWorkoutExercise[];
};

type RemoteWeightEntry = {
  _id: string;
  date: string;
  weight: number;
};

type HistorySession = {
  id: string;
  title: string;
  date: string;
  durationMin: number;
  setsCompleted: number;
  totalSets: number;
  calories: number;
  xp: number;
  completionPercentage: number;
  exercises: Array<{
    exerciseName: string;
    totalSets: number;
    completedSets: number;
    reps?: string;
    weight?: number;
    muscleGroup?: string;
  }>;
};

type FilterRange = "7d" | "30d" | "all";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "History - IronPulse AI" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [weight, setWeight] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [range, setRange] = useState<FilterRange>("30d");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const backendEnabled = hasBackendAuth();

  const workoutHistoryQuery = useQuery({
    queryKey: ["workout-history"],
    enabled: backendEnabled,
    queryFn: () =>
      apiRequest<{ items: RemoteWorkoutSession[] }>("/api/v1/workouts/history?limit=90"),
  });

  const bodyweightQuery = useQuery({
    queryKey: ["bodyweight-history"],
    enabled: backendEnabled,
    queryFn: () =>
      apiRequest<{ entries: RemoteWeightEntry[] }>("/api/v1/bodyweight/history?limit=90"),
  });

  const addWeightMutation = useMutation({
    mutationFn: async (value: number) =>
      apiRequest("/api/v1/bodyweight", {
        method: "POST",
        body: JSON.stringify({ weight: value, date: new Date().toISOString() }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bodyweight-history"] }),
    onError: () => setErrorText("Could not save bodyweight to MongoDB. Please try again."),
  });

  const sessions = useMemo<HistorySession[]>(() => {
    const remoteSessions = workoutHistoryQuery.data?.data.items ?? [];

    return remoteSessions.map((session) => {
      const exercises = session.exercises ?? [];
      const totalSets = exercises.reduce((total, exercise) => total + (exercise.totalSets || 0), 0);
      const setsCompleted =
        session.completedSets ||
        exercises.reduce((total, exercise) => total + (exercise.completedSetIndexes?.length || 0), 0);

      return {
        id: session._id,
        title: session.day,
        date: session.finishedAt || session.startedAt,
        durationMin: session.duration || 0,
        setsCompleted,
        totalSets,
        calories: session.caloriesBurned || 0,
        xp: Math.max(25, setsCompleted * 5),
        completionPercentage:
          session.completionPercentage || Math.round((setsCompleted / Math.max(1, totalSets)) * 100),
        exercises: exercises.map((exercise) => ({
          exerciseName: exercise.exerciseName,
          totalSets: exercise.totalSets || 0,
          completedSets: exercise.completedSetIndexes?.length || 0,
          reps: exercise.reps,
          weight: exercise.weight,
          muscleGroup: exercise.muscleGroup,
        })),
      };
    });
  }, [workoutHistoryQuery.data]);

  const weightEntries = useMemo(() => {
    const remoteWeights = bodyweightQuery.data?.data.entries ?? [];

    return [...remoteWeights]
      .map((entry) => ({ date: entry.date, weight: entry.weight }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [bodyweightQuery.data]);

  const filteredSessions = useMemo(() => {
    const now = Date.now();
    const days = range === "7d" ? 7 : range === "30d" ? 30 : Number.POSITIVE_INFINITY;

    return sessions.filter((session) => {
      if (!Number.isFinite(days)) return true;
      const ageMs = now - new Date(session.date).getTime();
      return ageMs <= days * 24 * 60 * 60 * 1000;
    });
  }, [range, sessions]);

  const workoutSummary = useMemo(() => {
    const totalWorkouts = filteredSessions.length;
    const totalMinutes = filteredSessions.reduce((sum, session) => sum + session.durationMin, 0);
    const totalSets = filteredSessions.reduce((sum, session) => sum + session.setsCompleted, 0);
    const averageCompletion = totalWorkouts
      ? Math.round(
          filteredSessions.reduce((sum, session) => sum + session.completionPercentage, 0) / totalWorkouts,
        )
      : 0;
    const activeDays = new Set(filteredSessions.map((session) => session.date.slice(0, 10))).size;
    const completedDays = new Set(filteredSessions.filter((session) => session.setsCompleted > 0).map((session) => session.date.slice(0, 10)));
    let streak = 0;
    const cursor = new Date();
    while (completedDays.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return { totalWorkouts, totalMinutes, totalSets, averageCompletion, activeDays, streak };
  }, [filteredSessions]);

  const weightSummary = useMemo(() => {
    const latest = weightEntries.at(-1);
    const previous = weightEntries.at(-2);
    const trend = latest && previous ? Number((latest.weight - previous.weight).toFixed(1)) : 0;
    const lowest = weightEntries.length ? Math.min(...weightEntries.map((entry) => entry.weight)) : null;
    const highest = weightEntries.length ? Math.max(...weightEntries.map((entry) => entry.weight)) : null;
    const chartData = weightEntries.map((entry) => ({
      label: new Date(entry.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
      value: entry.weight,
    }));

    return { latest, trend, lowest, highest, chartData };
  }, [weightEntries]);

  const topSession = filteredSessions[0];
  const bestSession = useMemo(
    () =>
      filteredSessions.reduce<HistorySession | null>((best, session) => {
        if (!best) return session;
        const bestScore = best.completionPercentage * 1000 + best.setsCompleted;
        const sessionScore = session.completionPercentage * 1000 + session.setsCompleted;
        return sessionScore > bestScore ? session : best;
      }, null),
    [filteredSessions],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number.parseFloat(weight);
    if (!Number.isFinite(value) || value <= 0) return;

    if (backendEnabled) {
      addWeightMutation.mutate(value);
    } else {
      setErrorText("Login to save bodyweight data in MongoDB.");
      return;
    }
    setWeight("");
    setErrorText(null);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Your journey</p>
          <h1 className="text-2xl font-bold tracking-tight">History</h1>
        </div>
        <div className="inline-flex w-full rounded-2xl bg-secondary p-1 sm:w-auto">
          {(["7d", "30d", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition sm:flex-none ${
                range === value
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <SyncBanner
        online={backendEnabled}
        message={errorText || (workoutHistoryQuery.isError ? "MongoDB workout history unavailable right now" : undefined)}
      />
      {(workoutHistoryQuery.isPending || bodyweightQuery.isPending) && backendEnabled && (
        <p className="mt-2 text-xs text-muted-foreground">Syncing latest gym data...</p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <InsightCard
          icon={<Calendar className="h-4 w-4" />}
          label="Workouts"
          value={String(workoutSummary.totalWorkouts)}
          sub={`${workoutSummary.activeDays} active days`}
        />
        <InsightCard
          icon={<Clock3 className="h-4 w-4" />}
          label="Training Time"
          value={`${workoutSummary.totalMinutes}m`}
          sub={`${workoutSummary.totalSets} sets logged`}
        />
        <InsightCard
          icon={<Target className="h-4 w-4" />}
          label="Completion"
          value={`${workoutSummary.averageCompletion}%`}
          sub="Average workout finish rate"
        />
        <InsightCard
          icon={<Flame className="h-4 w-4" />}
          label="Streak"
          value={`${workoutSummary.streak}d`}
          sub="Current training streak"
        />
      </div>

      <div className="mt-5 rounded-[1.75rem] border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Bodyweight trend</p>
              <p className="text-xs text-muted-foreground">
                {weightEntries.length} entries tracked
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-left sm:min-w-[240px]">
            <MiniMetric
              label="Latest"
              value={weightSummary.latest ? `${weightSummary.latest.weight} kg` : "--"}
            />
            <MiniMetric
              label="Change"
              value={
                weightSummary.latest && weightEntries.length > 1
                  ? `${weightSummary.trend > 0 ? "+" : ""}${weightSummary.trend} kg`
                  : "--"
              }
              tone={weightSummary.trend > 0 ? "up" : weightSummary.trend < 0 ? "down" : "neutral"}
            />
            <MiniMetric
              label="Range"
              value={
                weightSummary.lowest != null && weightSummary.highest != null
                  ? `${weightSummary.lowest}-${weightSummary.highest}`
                  : "--"
              }
            />
          </div>
        </div>

        {weightSummary.chartData.length > 1 ? (
          <div className="mt-4 h-44 rounded-2xl bg-background/70 p-2">
            <ResponsiveContainer>
              <LineChart data={weightSummary.chartData} margin={{ top: 10, right: 8, left: isMobile ? 0 : -16, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={18}
                />
                {!isMobile && (
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    domain={["auto", "auto"]}
                  />
                )}
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-background/70 p-4 text-sm text-muted-foreground">
            Add at least two weigh-ins to unlock your progress trend.
          </div>
        )}

        <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="h-12 flex-1 rounded-2xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground active:scale-[0.98]">
            <Plus className="h-4 w-4" /> Log weigh-in
          </button>
        </form>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">History highlights</p>
              <p className="text-xs text-muted-foreground">What stands out in this block</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <HighlightCard
              title="Most recent session"
              value={topSession ? topSession.title : "No sessions yet"}
              meta={topSession ? formatSessionMeta(topSession) : "Start a workout to build your timeline"}
            />
            <HighlightCard
              title="Best effort"
              value={bestSession ? `${bestSession.completionPercentage}% complete` : "Nothing to compare yet"}
              meta={bestSession ? `${bestSession.title} · ${bestSession.setsCompleted}/${bestSession.totalSets} sets` : "Complete a few sessions to surface patterns"}
            />
          </div>
        </div>

      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Workouts</h2>
        <p className="text-xs text-muted-foreground">
          Tap a session to inspect it
        </p>
      </div>

      <div className="mt-3 space-y-3">
        {filteredSessions.length === 0 && (
          <div className="rounded-[1.75rem] border border-dashed border-border p-8 text-center">
            <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No workouts found for this range. Try a wider filter or start your next session.
            </p>
          </div>
        )}

        {filteredSessions.map((session) => {
          const expanded = expandedSessionId === session.id;
          return (
            <button
              key={session.id}
              type="button"
              onClick={() => setExpandedSessionId(expanded ? null : session.id)}
              className="w-full rounded-[1.75rem] border border-border bg-card p-4 text-left shadow-soft transition hover:border-primary/25 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Dumbbell className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold capitalize">{session.title}</p>
                        <span className="rounded-full bg-secondary px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {session.completionPercentage}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(session.date).toLocaleDateString("en", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-sm font-bold tabular-nums">+{session.xp}</p>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">XP</p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${expanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <MetaPill icon={<Clock3 className="h-3.5 w-3.5" />} text={`${session.durationMin} min`} />
                    <MetaPill icon={<Target className="h-3.5 w-3.5" />} text={`${session.setsCompleted}/${session.totalSets} sets`} />
                    <MetaPill icon={<Flame className="h-3.5 w-3.5" />} text={`${session.calories} kcal`} />
                  </div>

                  {expanded && (
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <MiniMetric label="Duration" value={`${session.durationMin} min`} />
                        <MiniMetric label="Sets Done" value={`${session.setsCompleted}/${session.totalSets}`} />
                        <MiniMetric label="Calories" value={`${session.calories}`} />
                      </div>

                      {session.exercises.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          {session.exercises.map((exercise) => (
                            <div
                              key={`${session.id}-${exercise.exerciseName}`}
                              className="rounded-2xl bg-background/80 p-3"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold">{exercise.exerciseName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {exercise.muscleGroup || "Gym session"}{exercise.reps ? ` · ${exercise.reps} reps` : ""}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span className="rounded-full bg-secondary px-2.5 py-1">
                                    {exercise.completedSets}/{exercise.totalSets} sets
                                  </span>
                                  {exercise.weight ? (
                                    <span className="rounded-full bg-secondary px-2.5 py-1">
                                      {exercise.weight} kg
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl bg-background/80 p-3 text-sm text-muted-foreground">
                          Detailed exercise breakdown is available for MongoDB-synced workouts.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </AppShell>
  );
}

function InsightCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-soft">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
        {icon}
      </div>
      <p className="mt-3 text-lg font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "up" | "down" | "neutral";
}) {
  const icon =
    tone === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : tone === "down" ? <TrendingDown className="h-3.5 w-3.5" /> : null;

  return (
    <div className="rounded-2xl bg-background/80 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        {icon}
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function HighlightCard({ title, value, meta }: { title: string; value: string; meta: string }) {
  return (
    <div className="rounded-2xl bg-background/80 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
    </div>
  );
}

function MetaPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
      {icon}
      {text}
    </span>
  );
}

function formatSessionMeta(session: HistorySession) {
  return `${session.durationMin} min · ${session.setsCompleted}/${session.totalSets} sets`;
}
