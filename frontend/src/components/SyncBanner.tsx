type Props = {
  online: boolean;
  message?: string;
};

export function SyncBanner({ online, message }: Props) {
  return (
    <div
      className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
        online ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
      }`}
    >
      {online ? "Backend sync active" : "Local mode"}{message ? ` · ${message}` : ""}
    </div>
  );
}
