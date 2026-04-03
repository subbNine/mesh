import React from 'react';

interface AvatarProps {
  name: string;
  className?: string;
}

export function Avatar({ name, className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  return (
    <div className={`flex items-center justify-center bg-primary text-primary-foreground font-semibold rounded-full select-none flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
}
