import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Zap, ChevronRight, Play, Droplets, Heart, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProgressRing } from "@/components/ProgressRing";
import { SyncBanner } from "@/components/SyncBanner";
import { WORKOUT_PLAN, getDayIndex, getLevel, MOTIVATION, getProgressionWeek } from "@/lib/workoutPlan";
import { useAppState, computeStreak } from "@/lib/storage";
import { apiRequest, hasBackendAuth, isBackendReachable } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — IronPulse AI" },
      { name: "description", content: "Your daily workout, streak, and live progress." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state } = useAppState();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dayIdx = getDayIndex(now);
  const today = WORKOUT_PLAN[dayIdx - 1];
  const localLevel = getLevel(state.xp);
  const localStreak = computeStreak(state.sessions);
  const week = getProgressionWeek(state.startDate);
  const backendEnabled = hasBackendAuth();

  const healthQuery = useQuery({
    queryKey: ["backend-health"],
    queryFn: isBackendReachable,
    refetchInterval: 30_000,
  });

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    enabled: backendEnabled && healthQuery.data === true,
    queryFn: () => apiRequest<{
      user: { xp: number; level: string };
      latestWorkout?: { completionPercentage?: number };
      latestWeight?: { weight: number };
      leaderboardReady?: { xp: number; level: string };
    }>("/api/v1/dashboard"),
  });

  const motivationQuery = useQuery({
    queryKey: ["motivation"],
    enabled: backendEnabled && healthQuery.data === true,
    queryFn: () => apiRequest<{ message: string; type: string }>("/api/v1/notifications/motivation"),
    staleTime: 60_000,
  });

  const todayKey = now.toISOString().slice(0, 10);
  const todaySession = state.sessions.find((s) => s.date.slice(0, 10) === todayKey && s.day === dayIdx);
  const localCompletion = todaySession ? todaySession.setsCompleted / Math.max(1, todaySession.totalSets) : 0;
  const completion = dashboardQuery.data?.data.latestWorkout?.completionPercentage
    ? dashboardQuery.data.data.latestWorkout.completionPercentage / 100
    : localCompletion;

  const tip = motivationQuery.data?.data.message || useMemo(() => MOTIVATION[Math.floor(Date.now() / 3600_000) % MOTIVATION.length], []);
  const levelName = dashboardQuery.data?.data.leaderboardReady?.level || localLevel.current.name;
  const xpValue = dashboardQuery.data?.data.leaderboardReady?.xp ?? state.xp;
  const streak = localStreak;

  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="text-2xl font-bold tracking-tight">Ready to train?</h1>
        </div>
        <ThemeToggle />
      </div>
      <SyncBanner
        online={Boolean(backendEnabled && healthQuery.data)}
        message={dashboardQuery.isError ? "Backend unavailable, using cached local data" : undefined}
      />

      {/* Hero card — Today's workout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 relative overflow-hidden rounded-3xl p-5 shadow-elevated"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-black/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/70">Day {dayIdx} · Week {week}</div>
            <h2 className="mt-1 text-2xl font-bold text-white">{today.title}</h2>
            <p className="text-sm text-white/80 mt-0.5">{today.focus}</p>
            <div className="mt-3 flex items-center gap-3 text-white/90 text-sm">
              <span className="inline-flex items-center gap-1"><Flame className="h-4 w-4" /> {today.estCalories} kcal</span>
              <span className="inline-flex items-center gap-1"><Zap className="h-4 w-4" /> {today.estMinutes} min</span>
            </div>
          </div>
          <ProgressRing progress={completion} size={88} stroke={8}>
            <div className="text-white text-center">
              <div className="text-xl font-bold tabular-nums">{Math.round(completion * 100)}%</div>
              <div className="text-[10px] uppercase tracking-widest opacity-80">Done</div>
            </div>
          </ProgressRing>
        </div>

        <div className="relative mt-5 flex items-center gap-2">
          {today.exercises.length > 0 ? (
            <Link
              to="/workout/$day"
              params={{ day: String(dayIdx) }}
              className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-white text-foreground font-semibold shadow-lg active:scale-[0.98] transition"
            >
              <Play className="h-4 w-4 fill-current" /> {todaySession?.completed ? "Train again" : "Start workout"}
            </Link>
          ) : (
            <div className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-white/15 text-white font-semibold">
              Rest day · Recover well
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatCard icon={<Flame className="h-4 w-4" />} label="Streak" value={`${streak}d`} accent="oklch(0.7 0.2 25)" />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="Level" value={levelName} accent={localLevel.current.color} />
        <StatCard icon={<Zap className="h-4 w-4" />} label="XP" value={String(xpValue)} accent="oklch(0.7 0.18 262)" />
      </div>

      {/* Level progress */}
      <div className="mt-5 rounded-3xl bg-card border border-border p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Progress</p>
            <p className="text-base font-semibold mt-0.5">
              {localLevel.current.name}
              {localLevel.next && <span className="text-muted-foreground font-normal"> → {localLevel.next.name}</span>}
            </p>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {xpValue} / {localLevel.next?.min ?? xpValue} XP
          </p>
        </div>
        <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(localLevel.progress * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Coach tip */}
      <div className="mt-5 rounded-3xl glass p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl gradient-primary text-white flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">AI Coach</p>
          <p className="text-sm font-medium mt-0.5">{tip}</p>
        </div>
      </div>

      {/* Reminders */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <ReminderCard icon={<Droplets className="h-4 w-4" />} title="Hydrate" sub="Aim 3L today" />
        <ReminderCard icon={<Heart className="h-4 w-4" />} title="Recovery" sub="8h sleep target" />
      </div>

      {/* Weekly plan */}
      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-base font-semibold">This week</h3>
        <Link to="/exercises" className="text-xs text-primary font-medium inline-flex items-center gap-0.5">
          All exercises <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {WORKOUT_PLAN.map((d) => {
          const isToday = d.day === dayIdx;
          return (
            <Link
              key={d.day}
              to="/workout/$day"
              params={{ day: String(d.day) }}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition active:scale-[0.99] ${
                isToday ? "bg-accent border-primary/30 shadow-soft" : "bg-card border-border"
              }`}
            >
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-lg">{d.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{d.title}</p>
                  {isToday && <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">Today</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">Day {d.day} · {d.exercises.length} exercises</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-3 shadow-soft">
      <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in oklab, ${accent} 18%, transparent)`, color: accent }}>
        {icon}
      </div>
      <p className="mt-2 text-lg font-bold tabular-nums leading-none">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function ReminderCard({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-3 shadow-soft flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-secondary text-foreground flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}
