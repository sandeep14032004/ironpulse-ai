import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { WORKOUT_PLAN, getDayIndex } from "@/lib/workoutPlan";

export const Route = createFileRoute("/exercises")({
  head: () => ({ meta: [{ title: "Exercises - IronPulse AI" }] }),
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
    const okQ =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.dayTitle.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q);
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
        className="mt-5 block rounded-2xl gradient-primary p-4 text-white shadow-glow transition active:scale-[0.99]"
      >
        <p className="text-xs uppercase tracking-widest opacity-80">Quick start</p>
        <p className="mt-0.5 text-base font-bold">Begin today's workout</p>
      </Link>

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {muscles.map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold transition ${
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
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 active:scale-[0.99]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-xs font-bold tabular-nums">
              D{e.day}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{e.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{e.description}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{e.sets} x {e.reps} · {e.dayTitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No exercises match.</p>}
      </div>
    </AppShell>
  );
}
