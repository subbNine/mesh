import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth, loading, icon, children, disabled, ...props }, ref) => {
    // base styles
    // base styles
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium tracking-tight transition-all duration-200 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';
    
    // variants
    const variants = {
      primary: 'bg-gradient-to-b from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] focus-visible:ring-primary/50 border border-primary-700/50',
      secondary: 'bg-white text-foreground hover:bg-zinc-50 border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus-visible:ring-zinc-400',
      tertiary: 'text-muted-foreground hover:text-foreground hover:bg-zinc-100 focus-visible:ring-zinc-400 bg-transparent',
      destructive: 'bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] border border-red-700/50 focus-visible:ring-red-500/50',
    };
    
    // sizes
    const sizes = {
      sm: 'h-8 px-4 text-xs',
      md: 'h-10 px-5 text-sm',
      lg: 'h-12 px-8 text-base',
    };
    
    // width
    const widthClass = fullWidth ? 'w-full' : '';

    const combinedClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;

    return (
      <button
        ref={ref}
        className={combinedClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70 flex-shrink-0" />
        )}
        {!loading && icon && <span className="mr-2 flex-shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
