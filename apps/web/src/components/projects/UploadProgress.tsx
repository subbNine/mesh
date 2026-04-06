interface UploadProgressProps {
  progress: Record<string, number>;
}

export function UploadProgress({ progress }: UploadProgressProps) {
  const entries = Object.entries(progress);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Uploads in progress</p>
          <p className="text-sm text-muted-foreground">Files are being added to the project library.</p>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map(([name, value]) => (
          <div key={name} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-medium text-foreground">{name}</span>
              <span className="text-muted-foreground">{value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/70">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
