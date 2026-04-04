

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  circle?: boolean;
}

export function Skeleton({ width, height, className = '', circle = false }: SkeletonProps) {
  return (
    <div 
      className={`relative overflow-hidden bg-zinc-200 animate-pulse ${circle ? 'rounded-full' : 'rounded-md'} ${className}`}
      style={{ 
        width: width, 
        height: height,
      }}
    >
      <div 
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"
        style={{
          backgroundSize: '200% 100%'
        }}
      />
    </div>
  );
}

// Add keyframes to index.css if not already there, but we can also use Tailwind or inline
// For now, I'll rely on a global CSS class I'll add in the next step.
