import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { SyncBanner } from "@/components/SyncBanner";
import { useAppState } from "@/lib/storage";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calendar, Plus, Scale, Trophy } from "lucide-react";
import { apiRequest, hasBackendAuth } from "@/lib/api";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "History — IronPulse AI" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { state, addWeight } = useAppState();
  const queryClient = useQueryClient();
  const [weight, setWeight] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const backendEnabled = hasBackendAuth();

  const workoutHistoryQuery = useQuery({
    queryKey: ["workout-history"],
    enabled: backendEnabled,
    queryFn: () => apiRequest<{ items: Array<{ _id: string; day: string; startedAt: string; duration: number; completedSets: number; exercises: Array<unknown> }> }>("/api/v1/workouts/history?limit=30"),
  });

  const bodyweightQuery = useQuery({
    queryKey: ["bodyweight-history"],
    enabled: backendEnabled,
    queryFn: () => apiRequest<{ entries: Array<{ _id: string; date: string; weight: number }> }>("/api/v1/bodyweight/history?limit=30"),
  });

  const addWeightMutation = useMutation({
    mutationFn: async (value: number) =>
      apiRequest("/api/v1/bodyweight", {
        method: "POST",
        body: JSON.stringify({ weight: value, date: new Date().toISOString() }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bodyweight-history"] }),
    onError: () => setErrorText("Could not sync bodyweight to backend, saved locally."),
  });

  const remoteSessions = workoutHistoryQuery.data?.data.items || [];
  const sessions = remoteSessions.length
    ? remoteSessions.map((s) => ({
        id: s._id,
        title: s.day,
        date: s.startedAt,
        durationSec: (s.duration || 0) * 60,
        setsCompleted: s.completedSets || 0,
        totalSets: s.exercises?.length || 0,
        xp: 0,
      }))
    : [...state.sessions].reverse();
  const remoteWeights = bodyweightQuery.data?.data.entries || [];
  const weightData = (remoteWeights.length > 0 ? remoteWeights : state.weights).map((w) => ({ label: w.date.slice(5, 10), value: w.weight }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(weight);
    if (!v) return;
    addWeight({ date: new Date().toISOString(), weight: v });
    if (backendEnabled) addWeightMutation.mutate(v);
    setWeight("");
  };

  return (
    <AppShell>
      <div>
        <p className="text-sm text-muted-foreground">Your journey</p>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
      </div>
      <SyncBanner
        online={backendEnabled}
        message={errorText || (workoutHistoryQuery.isError ? "Workout history sync failed; showing local history" : undefined)}
      />
      {(workoutHistoryQuery.isPending || bodyweightQuery.isPending) && backendEnabled && (
        <p className="mt-2 text-xs text-muted-foreground">Syncing latest gym data...</p>
      )}

      {/* Weight tracker */}
      <div className="mt-5 rounded-2xl bg-card border border-border p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Bodyweight</p>
              <p className="text-xs text-muted-foreground">{state.weights.length} entries</p>
            </div>
          </div>
        </div>
        {weightData.length > 1 && (
          <div className="h-32 mt-3">
            <ResponsiveContainer>
              <LineChart data={weightData} margin={{ top: 6, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <form onSubmit={submit} className="mt-3 flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="flex-1 h-11 px-4 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button className="h-11 px-4 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center gap-1 active:scale-95">
            <Plus className="h-4 w-4" /> Log
          </button>
        </form>
      </div>

      {/* PRs */}
      {state.prs.length > 0 && (
        <div className="mt-4 rounded-2xl bg-card border border-border p-4 shadow-soft">
          <p className="text-sm font-semibold mb-2">Personal Records</p>
          <div className="space-y-2">
            {state.prs.map((pr, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium">{pr.exercise}</span>
                <span className="tabular-nums text-muted-foreground">{pr.value} {pr.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions */}
      <h2 className="mt-6 text-base font-semibold">Workouts</h2>
      <div className="mt-3 space-y-2">
        {sessions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No workouts yet. Start your first session today.</p>
          </div>
        )}
        {sessions.map((s) => {
          const d = new Date(s.date);
          return (
            <div key={s.id} className="rounded-2xl bg-card border border-border p-4 shadow-soft flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
                <Trophy className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {d.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" })} ·{" "}
                  {Math.round(s.durationSec / 60)}m · {s.setsCompleted}/{s.totalSets} sets
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">+{s.xp}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">XP</p>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
