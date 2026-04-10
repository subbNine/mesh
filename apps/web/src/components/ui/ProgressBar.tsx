type ProgressSegments = Readonly<{
  done?: number;
  inProgress?: number;
  review?: number;
  todo?: number;
}>;

type ProgressBarProps = Readonly<{
  value: number;
  segmented?: boolean;
  segments?: ProgressSegments;
  className?: string;
  trackClassName?: string;
}>;

const clamp = (value: number) => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

export function ProgressBar({
  value,
  segmented = false,
  segments,
  className = '',
  trackClassName = '',
}: ProgressBarProps) {
  const normalizedValue = clamp(value);
  const segmentTotal = (segments?.done ?? 0) + (segments?.inProgress ?? 0) + (segments?.review ?? 0) + (segments?.todo ?? 0);

  const barToneClass = normalizedValue >= 100
    ? 'from-emerald-500 via-emerald-400 to-teal-400'
    : normalizedValue > 0
      ? 'from-amber-400 via-primary to-sky-400'
      : 'from-zinc-300 to-zinc-200';

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(normalizedValue)}
      className={`h-2.5 w-full overflow-hidden rounded-full border border-border/50 bg-muted/70 ${trackClassName} ${className}`}
    >
      {segmented && segmentTotal > 0 ? (
        <div className="flex h-full w-full overflow-hidden rounded-full">
          {(segments?.done ?? 0) > 0 && (
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${((segments?.done ?? 0) / segmentTotal) * 100}%` }} />
          )}
          {(segments?.inProgress ?? 0) > 0 && (
            <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${((segments?.inProgress ?? 0) / segmentTotal) * 100}%` }} />
          )}
          {(segments?.review ?? 0) > 0 && (
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300" style={{ width: `${((segments?.review ?? 0) / segmentTotal) * 100}%` }} />
          )}
          {(segments?.todo ?? 0) > 0 && (
            <div className="h-full bg-zinc-300" style={{ width: `${((segments?.todo ?? 0) / segmentTotal) * 100}%` }} />
          )}
        </div>
      ) : (
        <div className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-300 ${barToneClass}`} style={{ width: `${normalizedValue}%` }} />
      )}
    </div>
  );
}
