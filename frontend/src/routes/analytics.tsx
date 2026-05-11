import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { SyncBanner } from "@/components/SyncBanner";
import { useAppState, computeStreak } from "@/lib/storage";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Flame, Timer, Trophy, TrendingUp } from "lucide-react";
import { WORKOUT_PLAN } from "@/lib/workoutPlan";
import { apiRequest, hasBackendAuth } from "@/lib/api";
import { useAuthProfile } from "@/lib/auth";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics - IronPulse AI" }] }),
  component: Analytics,
});

const TABS = ["Daily", "Weekly", "Monthly"] as const;

type DailyRemote = {
  completedWorkouts: number;
  setsCompleted: number;
  caloriesBurned: number;
  duration: number;
  completionScore: number;
};

type WeeklyRemote = {
  totalWorkouts: number;
  streak: number;
  trainingVolume: number;
  strongestDay: string | null;
  muscleGroupFrequency: Record<string, number>;
  trainingIntensityScore: number;
  workoutAdherence: number;
};

type MonthlyRemote = {
  consistencyHeatmap: Array<{ date: string; value: number }>;
  muscleDistribution: Record<string, number>;
  streakHeatmap: Array<{ date: string; value: number }>;
  volumeProgression: Array<{ date: string; completedSets: number }>;
  progressionTrends: Array<{ date: string; completion: number }>;
  totalGymDays: number;
};

function Analytics() {
  const { state } = useAppState();
  const profileQuery = useAuthProfile(hasBackendAuth());
  const [tab, setTab] = useState<typeof TABS[number]>("Weekly");
  const backendEnabled = hasBackendAuth();

  const dailyQuery = useQuery({
    queryKey: ["analytics-daily"],
    enabled: backendEnabled && tab === "Daily",
    queryFn: () => apiRequest<DailyRemote>("/api/v1/analytics/daily"),
  });
  const weeklyQuery = useQuery({
    queryKey: ["analytics-weekly"],
    enabled: backendEnabled && tab === "Weekly",
    queryFn: () => apiRequest<WeeklyRemote>("/api/v1/analytics/weekly"),
  });
  const monthlyQuery = useQuery({
    queryKey: ["analytics-monthly"],
    enabled: backendEnabled && tab === "Monthly",
    queryFn: () => apiRequest<MonthlyRemote>("/api/v1/analytics/monthly"),
  });

  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const sessions = state.sessions.filter((s) => s.date.slice(0, 10) === key);
      days.push({
        label: d.toLocaleDateString("en", { weekday: "short" }),
        sets: sessions.reduce((a, s) => a + s.setsCompleted, 0),
        cal: sessions.reduce((a, s) => a + s.calories, 0),
        min: Math.round(sessions.reduce((a, s) => a + s.durationSec, 0) / 60),
      });
    }
    return days;
  }, [state.sessions]);

  const last30 = useMemo(() => {
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const sessions = state.sessions.filter((s) => s.date.slice(0, 10) === key);
      out.push({ key, label: d.getDate().toString(), value: sessions.reduce((a, s) => a + s.setsCompleted, 0) });
    }
    return out;
  }, [state.sessions]);

  const muscleDistLocal = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of state.sessions) {
      const day = WORKOUT_PLAN[s.day - 1];
      day?.muscles.forEach((m) => (map[m] = (map[m] || 0) + s.setsCompleted));
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [state.sessions]);

  const totalSets = state.sessions.reduce((a, s) => a + s.setsCompleted, 0);
  const totalCal = state.sessions.reduce((a, s) => a + s.calories, 0);
  const totalMin = Math.round(state.sessions.reduce((a, s) => a + s.durationSec, 0) / 60);
  const totalGymDaysLocal = new Set(state.sessions.map((s) => s.date.slice(0, 10))).size;
  const streakLocal = computeStreak(state.sessions);
  const consistencyLocal = Math.min(100, Math.round((last7.filter((d) => d.sets > 0).length / 6) * 100));
  const todaySession = state.sessions.find((s) => s.date.slice(0, 10) === new Date().toISOString().slice(0, 10));

  const strongestDayLocal = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of state.sessions) map[s.title] = (map[s.title] || 0) + s.setsCompleted;
    const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
    return top?.[0] ?? "—";
  }, [state.sessions]);

  const monthlyRemote = monthlyQuery.data?.data;
  const weeklyRemote = weeklyQuery.data?.data;
  const dailyRemote = dailyQuery.data?.data;

  const muscleDistRemote = monthlyRemote
    ? Object.entries(monthlyRemote.muscleDistribution || {}).map(([name, value]) => ({ name, value }))
    : [];
  const muscleDist = muscleDistRemote.length > 0 ? muscleDistRemote : muscleDistLocal;

  const volumeProgression =
    monthlyRemote?.volumeProgression.map((item) => ({
      label: new Date(item.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
      sets: item.completedSets,
    })) ?? last7;

  const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  const signedInLabel = profileQuery.data?.name ? `${profileQuery.data.name}'s analytics` : "Analytics";

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Insights</p>
          <h1 className="text-2xl font-bold tracking-tight">{signedInLabel}</h1>
        </div>
      </div>
      <SyncBanner
        online={backendEnabled}
        message={
          backendEnabled
            ? dailyQuery.isError || weeklyQuery.isError || monthlyQuery.isError
              ? "Showing local analytics due to sync issue"
              : undefined
            : "Login to store and retrieve analytics per user from MongoDB."
        }
      />
      {(dailyQuery.isPending || weeklyQuery.isPending || monthlyQuery.isPending) && backendEnabled && (
        <p className="mt-2 text-xs text-muted-foreground">Refreshing analytics...</p>
      )}

      <div className="mt-5 inline-flex w-full rounded-full bg-secondary p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`h-9 flex-1 rounded-full text-sm font-semibold transition ${
              tab === t ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Daily" && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Tile icon={<Trophy className="h-4 w-4" />} label="Sets today" value={String(dailyRemote?.setsCompleted ?? todaySession?.setsCompleted ?? 0)} />
            <Tile icon={<Flame className="h-4 w-4" />} label="Calories" value={String(dailyRemote?.caloriesBurned ?? todaySession?.calories ?? 0)} />
            <Tile icon={<Timer className="h-4 w-4" />} label="Duration" value={`${dailyRemote?.duration ?? Math.round((todaySession?.durationSec ?? 0) / 60)}m`} />
            <Tile icon={<TrendingUp className="h-4 w-4" />} label="Completion" value={`${Math.round(dailyRemote?.completionScore ?? 0)}%`} />
          </div>
          <Card title="Today completion">
            <div className="overflow-hidden rounded-full bg-secondary">
              <div
                className="h-2 gradient-primary"
                style={{
                  width: `${dailyRemote?.completionScore ?? (todaySession ? (todaySession.setsCompleted / Math.max(1, todaySession.totalSets)) * 100 : 0)}%`,
                }}
              />
            </div>
          </Card>
        </div>
      )}

      {tab === "Weekly" && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Tile icon={<Flame className="h-4 w-4" />} label="Streak" value={`${weeklyRemote?.streak ?? profileQuery.data?.streak ?? streakLocal}d`} />
            <Tile icon={<TrendingUp className="h-4 w-4" />} label="Volume" value={String(weeklyRemote?.trainingVolume ?? last7.reduce((a, d) => a + d.sets, 0))} />
            <Tile icon={<Trophy className="h-4 w-4" />} label="Top day" value={(weeklyRemote?.strongestDay ?? strongestDayLocal).split(" ")[0]} />
          </div>
          <Card title="Training volume - recent block">
            <div className="h-44">
              <ResponsiveContainer>
                <BarChart data={volumeProgression.slice(-7)} margin={{ top: 10, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} />
                  <Bar dataKey="sets" radius={[8, 8, 0, 0]}>
                    {volumeProgression.slice(-7).map((_, i) => (
                      <Cell key={i} fill="var(--chart-1)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title="Weekly adherence">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums">{weeklyRemote?.workoutAdherence ?? consistencyLocal}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Based on how consistently workouts were completed.</p>
          </Card>
        </div>
      )}

      {tab === "Monthly" && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Tile icon={<Trophy className="h-4 w-4" />} label="Sets" value={String(monthlyRemote ? volumeProgression.reduce((sum, item) => sum + item.sets, 0) : totalSets)} />
            <Tile icon={<Flame className="h-4 w-4" />} label="Calories" value={String(totalCal)} />
            <Tile icon={<Timer className="h-4 w-4" />} label="Gym days" value={String(monthlyRemote?.totalGymDays ?? totalGymDaysLocal)} />
          </div>
          <Card title="30-day heatmap">
            <div className="grid grid-cols-10 gap-1.5">
              {(monthlyRemote?.consistencyHeatmap?.length
                ? monthlyRemote.consistencyHeatmap.map((item) => ({
                    key: item.date,
                    value: item.value,
                  }))
                : last30
              ).map((d) => {
                const value = "value" in d ? d.value : 0;
                const key = "key" in d ? d.key : d.date;
                const intensity = Math.min(1, value / 25);
                return (
                  <div
                    key={key}
                    title={`${key}: ${value} sets`}
                    className="aspect-square rounded-md"
                    style={{
                      background:
                        value === 0
                          ? "var(--muted)"
                          : `color-mix(in oklab, var(--primary) ${20 + intensity * 80}%, transparent)`,
                    }}
                  />
                );
              })}
            </div>
          </Card>
          <Card title="Muscle focus">
            {muscleDist.length === 0 ? (
              <p className="text-sm text-muted-foreground">Train to see your distribution.</p>
            ) : (
              <div className="h-52">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={muscleDist} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {muscleDist.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {muscleDist.map((m, i) => (
                <span key={m.name} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-1 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: chartColors[i % chartColors.length] }} />
                  {m.name}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

const tooltipStyle: CSSProperties = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--popover-foreground)",
};

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">{icon}</div>
      <p className="mt-2 text-lg font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
