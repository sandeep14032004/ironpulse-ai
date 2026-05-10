import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { WORKOUT_PLAN, getDayIndex } from "@/lib/workoutPlan";

export const Route = createFileRoute("/exercises")({
  head: () => ({ meta: [{ title: "Exercises — IronPulse AI" }] }),
  component: Exercises,
});

function Exercises() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const today = getDayIndex();

  const all = useMemo(() => {
    return WORKOUT_PLAN.flatMap((d) =>
      d.exercises.map((e) => ({ ...e, day: d.day, dayTitle: d.title, muscles: d.muscles })),
    );
  }, []);

  const muscles = useMemo(() => ["All", ...Array.from(new Set(WORKOUT_PLAN.flatMap((d) => d.muscles)))], []);

  const filtered = all.filter((e) => {
    const q = query.toLowerCase();
    const okQ = !q || e.name.toLowerCase().includes(q) || e.dayTitle.toLowerCase().includes(q);
    const okM = filter === "All" || e.muscles.includes(filter);
    return okQ && okM;
  });

  return (
    <AppShell>
      <div>
        <p className="text-sm text-muted-foreground">Library</p>
        <h1 className="text-2xl font-bold tracking-tight">Exercises</h1>
      </div>

      <Link
        to="/workout/$day"
        params={{ day: String(today === 7 ? 1 : today) }}
        className="mt-5 block rounded-2xl gradient-primary text-white p-4 shadow-glow active:scale-[0.99] transition"
      >
        <p className="text-xs uppercase tracking-widest opacity-80">Quick start</p>
        <p className="text-base font-bold mt-0.5">Begin today's workout</p>
      </Link>

      <div className="mt-5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises…"
          className="w-full h-11 pl-9 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {muscles.map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={`shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition ${
              filter === m ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {filtered.map((e, i) => (
          <Link
            key={i}
            to="/workout/$day"
            params={{ day: String(e.day) }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border active:scale-[0.99]"
          >
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-xs tabular-nums">
              D{e.day}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{e.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{e.sets} × {e.reps} · {e.dayTitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No exercises match.</p>
        )}
      </div>
    </AppShell>
  );
}
