import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-5 pt-6 pb-32">{children}</div>
      <BottomNav />
    </div>
  );
}
