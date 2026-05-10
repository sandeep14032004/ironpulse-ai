import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BarChart3, Dumbbell, History, Settings as SettingsIcon } from "lucide-react";

const items = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/exercises", label: "Train", Icon: Dumbbell },
  { to: "/analytics", label: "Stats", Icon: BarChart3 },
  { to: "/history", label: "History", Icon: History },
  { to: "/settings", label: "Settings", Icon: SettingsIcon },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 safe-pb">
      <div className="mx-auto max-w-xl px-3 pb-3">
        <div className="glass rounded-2xl shadow-elevated px-2 py-2 flex items-center justify-between">
          {items.map(({ to, label, Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors"
              >
                <div
                  className={`relative flex items-center justify-center h-9 w-9 rounded-xl transition-all ${
                    active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </div>
                <span
                  className={`text-[10px] font-medium tracking-wide ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
