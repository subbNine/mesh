interface TaskCardSkeletonProps {
  className?: string;
}

export function TaskCardSkeleton({ className = '' }: TaskCardSkeletonProps) {
  return (
    <div className={`flex flex-col bg-card border border-border rounded-xl flex-shrink-0 animate-pulse ${className}`}>
      <div className="h-[140px] w-full bg-muted/50 border-b border-border"></div>
      <div className="p-4 flex flex-col flex-1">
        <div className="h-4 bg-muted/60 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-muted/40 rounded w-full mb-1"></div>
        <div className="h-3 bg-muted/40 rounded w-2/3 flex-1 mb-4"></div>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-16 bg-muted/60 rounded-full"></div>
            <div className="h-3 w-12 bg-muted/40 rounded"></div>
          </div>
          <div className="w-8 h-8 rounded-full bg-muted/60"></div>
        </div>
      </div>
    </div>
  );
}
