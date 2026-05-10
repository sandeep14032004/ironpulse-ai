import { useEffect, useRef, useState } from "react";
import { Pause, Play, X, Plus, Maximize2, Minimize2 } from "lucide-react";
import { ProgressRing } from "./ProgressRing";

type Props = {
  seconds: number;
  onClose: () => void;
};

export function RestTimer({ seconds, onClose }: Props) {
  const [total, setTotal] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);
  const [full, setFull] = useState(false);
  const startedRef = useRef(Date.now());

  useEffect(() => {
    if (!running) return;
    startedRef.current = Date.now() - (total - remaining) * 1000;
    const id = setInterval(() => {
      const elapsed = (Date.now() - startedRef.current) / 1000;
      const next = Math.max(0, total - elapsed);
      setRemaining(next);
      if (next <= 0) {
        setRunning(false);
        try {
          if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
        } catch {}
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, total]);

  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60).toString().padStart(2, "0");

  const Inner = (
    <ProgressRing progress={1 - remaining / Math.max(1, total)} size={full ? 280 : 180} stroke={full ? 16 : 12}>
      <div className="text-center">
        <div className={`tabular-nums font-semibold ${full ? "text-6xl" : "text-4xl"}`}>
          {mm}:{ss}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Rest</div>
      </div>
    </ProgressRing>
  );

  return (
    <div className={`fixed inset-x-0 z-50 ${full ? "inset-0 bg-background" : "bottom-24"}`}>
      <div className={`mx-auto max-w-xl px-4 ${full ? "h-full flex items-center justify-center" : ""}`}>
        <div
          className={`glass rounded-3xl shadow-elevated p-5 ${
            full ? "w-full h-full flex flex-col items-center justify-center gap-8 rounded-none border-0 bg-background" : "flex items-center gap-4"
          }`}
        >
          {Inner}
          <div className={`flex ${full ? "flex-row gap-3" : "flex-col gap-2 ml-auto"}`}>
            <button
              onClick={() => setRunning((r) => !r)}
              className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow active:scale-95 transition"
              aria-label={running ? "Pause" : "Resume"}
            >
              {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <button
              onClick={() => {
                setTotal((t) => t + 15);
                setRemaining((r) => r + 15);
              }}
              className="h-11 w-11 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center active:scale-95"
              aria-label="Add 15s"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              onClick={() => setFull((f) => !f)}
              className="h-11 w-11 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center active:scale-95"
              aria-label="Fullscreen"
            >
              {full ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
            <button
              onClick={onClose}
              className="h-11 w-11 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center active:scale-95"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
