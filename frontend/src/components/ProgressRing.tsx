type Props = {
  progress: number; // 0..1
  size?: number;
  stroke?: number;
  className?: string;
  children?: React.ReactNode;
  trackOpacity?: number;
};

export function ProgressRing({ progress, size = 120, stroke = 10, className, children, trackOpacity = 0.15 }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div className={`relative inline-flex items-center justify-center ${className ?? ""}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={stroke} fill="none" className="text-primary" style={{ opacity: trackOpacity }} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          className="text-primary transition-[stroke-dashoffset] duration-700 ease-out"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
