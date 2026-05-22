import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Zap, ChevronRight, Play, Droplets, Heart, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProgressRing } from "@/components/ProgressRing";
import { SyncBanner } from "@/components/SyncBanner";
import { WORKOUT_PLAN, getDayIndex, getLevel, MOTIVATION } from "@/lib/workoutPlan";
import { apiRequest, hasBackendAuth } from "@/lib/api";
import { useAuthProfile } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today - IronPulse AI" },
      { name: "description", content: "Your daily workout, streak, and live progress." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dayIdx = getDayIndex(now);
  const today = WORKOUT_PLAN[dayIdx - 1];
  const week = 1;
  const backendEnabled = hasBackendAuth();

  const profileQuery = useAuthProfile(backendEnabled);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    enabled: backendEnabled,
    queryFn: () =>
      apiRequest<{
        user: { xp: number; level: string; streak: number; name: string };
        latestWorkout?: { completionPercentage?: number };
        latestWeight?: { weight: number };
        leaderboardReady?: { xp: number; level: string };
      }>("/api/v1/dashboard"),
  });

  const motivationQuery = useQuery({
    queryKey: ["motivation"],
    enabled: backendEnabled,
    queryFn: () => apiRequest<{ message: string; type: string }>("/api/v1/notifications/motivation"),
    staleTime: 60_000,
  });

  const completion = dashboardQuery.data?.data.latestWorkout?.completionPercentage
    ? dashboardQuery.data.data.latestWorkout.completionPercentage / 100
    : 0;

  const fallbackTip = useMemo(
    () => MOTIVATION[Math.floor(Date.now() / 3600_000) % MOTIVATION.length],
    [],
  );
  const tip = motivationQuery.data?.data.message || fallbackTip;
  const profileUser = profileQuery.data;
  const xpValue = dashboardQuery.data?.data.leaderboardReady?.xp ?? profileUser?.xp ?? 0;
  const levelProgress = getLevel(xpValue);
  const levelName = dashboardQuery.data?.data.leaderboardReady?.level || profileUser?.level || levelProgress.current.name;
  const streak = dashboardQuery.data?.data.user?.streak ?? profileUser?.streak ?? 0;
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const userName = dashboardQuery.data?.data.user?.name || profileUser?.name;

  return (
    <AppShell>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="text-2xl font-bold tracking-tight">{userName ? `${userName}, ready to train?` : "Ready to train?"}</h1>
        </div>
        <ThemeToggle />
      </div>
      <SyncBanner
        online={backendEnabled && !dashboardQuery.isError}
        message={
          backendEnabled
            ? dashboardQuery.isError
              ? "MongoDB data unavailable right now"
              : undefined
            : "Login to sync your workouts, streak, XP, and analytics to MongoDB."
        }
      />

      {!backendEnabled && (
        <Link
          to="/auth"
          className="mt-4 flex items-center justify-between rounded-3xl border border-primary/25 bg-card p-4 shadow-soft"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Account</p>
            <p className="mt-1 text-sm font-semibold">Login or register</p>
            <p className="mt-1 text-xs text-muted-foreground">Keep each user's gym data separate in MongoDB.</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-5 overflow-hidden rounded-3xl p-5 shadow-elevated"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-black/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/70">Day {dayIdx} · Week {week}</div>
            <h2 className="mt-1 text-2xl font-bold text-white">{today.title}</h2>
            <p className="mt-0.5 text-sm text-white/80">{today.focus}</p>
            <div className="mt-3 flex items-center gap-3 text-sm text-white/90">
              <span className="inline-flex items-center gap-1">
                <Flame className="h-4 w-4" /> {today.estCalories} kcal
              </span>
              <span className="inline-flex items-center gap-1">
                <Zap className="h-4 w-4" /> {today.estMinutes} min
              </span>
            </div>
          </div>
          <ProgressRing progress={completion} size={88} stroke={8}>
            <div className="text-center text-white">
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
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-foreground shadow-lg transition active:scale-[0.98]"
            >
              <Play className="h-4 w-4 fill-current" /> Start workout
            </Link>
          ) : (
            <div className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/15 font-semibold text-white">
              Rest day · Recover well
            </div>
          )}
        </div>
      </motion.div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatCard icon={<Flame className="h-4 w-4" />} label="Streak" value={`${streak}d`} accent="oklch(0.7 0.2 25)" />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="Level" value={levelName} accent={levelProgress.current.color} />
        <StatCard icon={<Zap className="h-4 w-4" />} label="XP" value={String(xpValue)} accent="oklch(0.7 0.18 262)" />
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Progress</p>
            <p className="mt-0.5 text-base font-semibold">
              {levelProgress.current.name}
              {levelProgress.next && <span className="font-normal text-muted-foreground"> → {levelProgress.next.name}</span>}
            </p>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {xpValue} / {levelProgress.next?.min ?? xpValue} XP
          </p>
        </div>
        <div className="mt-3 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-2 gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(levelProgress.progress * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-3xl p-4 glass">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-primary text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">AI Coach</p>
          <p className="mt-0.5 text-sm font-medium">{tip}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <ReminderCard icon={<Droplets className="h-4 w-4" />} title="Hydrate" sub="Aim 3L today" />
        <ReminderCard icon={<Heart className="h-4 w-4" />} title="Recovery" sub="8h sleep target" />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-base font-semibold">This week</h3>
        <Link to="/exercises" className="inline-flex items-center gap-0.5 text-xs font-medium text-primary">
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
              className={`flex items-center gap-3 rounded-2xl border p-3 transition active:scale-[0.99] ${
                isToday ? "border-primary/30 bg-accent shadow-soft" : "border-border bg-card"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-lg">{d.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{d.title}</p>
                  {isToday && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-primary-foreground">
                      Today
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">Day {d.day} · {d.exercises.length} exercises</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-xl"
        style={{ background: `color-mix(in oklab, ${accent} 18%, transparent)`, color: accent }}
      >
        {icon}
      </div>
      <p className="mt-2 text-lg font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function ReminderCard({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">{icon}</div>
      <div>
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}
