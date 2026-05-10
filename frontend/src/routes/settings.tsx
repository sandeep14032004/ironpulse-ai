import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocalStorage, INITIAL_SETTINGS, type Settings } from "@/lib/storage";
import { Bell, Dumbbell, Ruler, Timer, Zap } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — IronPulse AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [s, setS] = useLocalStorage<Settings>("ironpulse:settings", INITIAL_SETTINGS);

  return (
    <AppShell>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Preferences</p>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
        <ThemeToggle />
      </div>

      <Section title="Appearance">
        <Row icon={<Zap className="h-4 w-4" />} title="Theme" sub="Switch dark / light">
          <ThemeToggle />
        </Row>
      </Section>

      <Section title="Workout">
        <Row icon={<Timer className="h-4 w-4" />} title="Rest timer" sub={`${s.restSeconds}s default`}>
          <select
            value={s.restSeconds}
            onChange={(e) => setS({ ...s, restSeconds: Number(e.target.value) })}
            className="bg-secondary text-sm px-3 h-9 rounded-lg border border-border"
          >
            {[45, 60, 75, 90, 120, 180].map((n) => (
              <option key={n} value={n}>{n}s</option>
            ))}
          </select>
        </Row>
        <Row icon={<Ruler className="h-4 w-4" />} title="Units" sub="Weight measurement">
          <div className="inline-flex p-1 rounded-full bg-secondary">
            {(["kg", "lb"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setS({ ...s, units: u })}
                className={`h-7 px-3 rounded-full text-xs font-semibold ${
                  s.units === u ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
                }`}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </Row>
        <Row icon={<Dumbbell className="h-4 w-4" />} title="Live Gym Mode" sub="Larger touch targets">
          <Toggle on={s.liveGymMode} onChange={(v) => setS({ ...s, liveGymMode: v })} />
        </Row>
      </Section>

      <Section title="Notifications">
        <Row icon={<Bell className="h-4 w-4" />} title="Smart reminders" sub="Hydration, recovery & coaching">
          <Toggle on={s.notifications} onChange={(v) => setS({ ...s, notifications: v })} />
        </Row>
      </Section>

      <p className="mt-8 text-center text-xs text-muted-foreground">IronPulse AI · v1.0 · Built for serious lifters</p>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 px-1">{title}</p>
      <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">{children}</div>
    </div>
  );
}

function Row({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="h-9 w-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition ${on ? "bg-primary" : "bg-secondary"}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
