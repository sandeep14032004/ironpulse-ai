import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Dumbbell, LogOut, Ruler, Timer, UserRound, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { INITIAL_SETTINGS, type Settings } from "@/lib/storage";
import { apiRequest, hasBackendAuth } from "@/lib/api";
import { logoutUser, useAuthProfile } from "@/lib/auth";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings - IronPulse AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const backendEnabled = hasBackendAuth();
  const profileQuery = useAuthProfile(backendEnabled);
  const [draft, setDraft] = useState<Settings>(INITIAL_SETTINGS);

  useEffect(() => {
    if (!profileQuery.data) return;
    setDraft((current) => ({
      ...current,
      restSeconds: profileQuery.data.timerDuration ?? current.restSeconds,
      units: profileQuery.data.preferredUnits === "imperial" ? "lb" : "kg",
      notifications: profileQuery.data.notificationsEnabled ?? current.notifications,
    }));
  }, [profileQuery.data]);

  const saveProfileMutation = useMutation({
    mutationFn: async (next: Pick<Settings, "restSeconds" | "units" | "notifications">) =>
      apiRequest<{ user: unknown }>("/api/v1/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          timerDuration: next.restSeconds,
          preferredUnits: next.units === "lb" ? "imperial" : "metric",
          notificationsEnabled: next.notifications,
        }),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["auth-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      navigate({ to: "/auth" });
    },
  });

  const setSettings = (next: Partial<Settings>) => {
    const merged = { ...draft, ...next };
    setDraft(merged);
    if (
      backendEnabled &&
      (next.restSeconds !== undefined || next.units !== undefined || next.notifications !== undefined)
    ) {
      saveProfileMutation.mutate({
        restSeconds: merged.restSeconds,
        units: merged.units,
        notifications: merged.notifications,
      });
    }
  };

  const accountSub = useMemo(() => {
    if (!backendEnabled) return "Login to sync all your gym data to MongoDB";
    if (!profileQuery.data) return "Loading account";
    return profileQuery.data.email;
  }, [backendEnabled, profileQuery.data]);

  return (
    <AppShell>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Preferences</p>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
        <ThemeToggle />
      </div>

      <Section title="Account">
        <Row icon={<UserRound className="h-4 w-4" />} title={profileQuery.data?.name || "Account"} sub={accountSub}>
          {backendEnabled ? (
            <button
              onClick={() => logoutMutation.mutate()}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-secondary px-3 text-sm"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <Link to="/auth" className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground">
              Login
            </Link>
          )}
        </Row>
      </Section>

      <Section title="Appearance">
        <Row icon={<Zap className="h-4 w-4" />} title="Theme" sub="Switch dark / light">
          <ThemeToggle />
        </Row>
      </Section>

      <Section title="Workout">
        <Row
          icon={<Timer className="h-4 w-4" />}
          title="Rest timer"
          sub={`${draft.restSeconds}s default${backendEnabled ? " - synced" : ""}`}
        >
          <select
            value={draft.restSeconds}
            onChange={(e) => setSettings({ restSeconds: Number(e.target.value) })}
            className="h-9 rounded-lg border border-border bg-secondary px-3 text-sm"
          >
            {[45, 60, 75, 90, 120, 180].map((n) => (
              <option key={n} value={n}>
                {n}s
              </option>
            ))}
          </select>
        </Row>
        <Row icon={<Ruler className="h-4 w-4" />} title="Units" sub={backendEnabled ? "Saved to your profile" : "Weight measurement"}>
          <div className="inline-flex rounded-full bg-secondary p-1">
            {(["kg", "lb"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setSettings({ units: u })}
                className={`h-7 rounded-full px-3 text-xs font-semibold ${
                  draft.units === u ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
                }`}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </Row>
        <Row icon={<Dumbbell className="h-4 w-4" />} title="Live Gym Mode" sub="Larger touch targets for this view">
          <Toggle on={draft.liveGymMode} onChange={(v) => setSettings({ liveGymMode: v })} />
        </Row>
      </Section>

      <Section title="Notifications">
        <Row icon={<Bell className="h-4 w-4" />} title="Smart reminders" sub={backendEnabled ? "Saved to your account" : "Hydration, recovery & coaching"}>
          <Toggle on={draft.notifications} onChange={(v) => setSettings({ notifications: v })} />
        </Row>
      </Section>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        IronPulse AI - v1.0 - {backendEnabled ? "Account sync enabled" : "Guest mode"}
      </p>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <p className="mb-2 px-1 text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">{children}</div>
    </div>
  );
}

function Row({ icon, title, sub, children }: { icon: ReactNode; title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
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
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
