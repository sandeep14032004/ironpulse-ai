import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, X, Plus, Maximize2, Minimize2, Move } from "lucide-react";
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
  const constraintsRef = useRef<HTMLDivElement | null>(null);

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
  const ss = Math.floor(remaining % 60)
    .toString()
    .padStart(2, "0");

  const ring = (
    <ProgressRing progress={1 - remaining / Math.max(1, total)} size={full ? 280 : 160} stroke={full ? 16 : 12}>
      <div className="text-center">
        <div className={`tabular-nums font-semibold ${full ? "text-6xl" : "text-4xl"}`}>
          {mm}:{ss}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Rest</div>
      </div>
    </ProgressRing>
  );

  if (full) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-8 px-4">
          {ring}
          <div className="flex flex-row gap-3">
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition active:scale-95"
              aria-label={running ? "Pause" : "Resume"}
            >
              {running ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
            </button>
            <button
              onClick={() => {
                setTotal((t) => t + 15);
                setRemaining((r) => r + 15);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-95"
              aria-label="Add 15 seconds"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              onClick={() => setFull(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-95"
              aria-label="Minimize"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-95"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={constraintsRef} className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.08}
        dragMomentum={false}
        initial={{ x: 0, y: 0 }}
        className="pointer-events-auto absolute bottom-24 left-4 right-4 mx-auto w-auto max-w-sm touch-none"
      >
        <div className="glass rounded-3xl border border-border/60 p-4 shadow-elevated">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Move className="h-3.5 w-3.5" />
              Drag timer
            </div>
            <button
              onClick={() => setFull(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-95"
              aria-label="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {ring}
            <div className="ml-auto flex flex-col gap-2">
              <button
                onClick={() => setRunning((r) => !r)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition active:scale-95"
                aria-label={running ? "Pause" : "Resume"}
              >
                {running ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
              </button>
              <button
                onClick={() => {
                  setTotal((t) => t + 15);
                  setRemaining((r) => r + 15);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-95"
                aria-label="Add 15 seconds"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-95"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
