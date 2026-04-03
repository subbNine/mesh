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
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    // variants
    const variants = {
      primary: 'bg-primary hover:bg-primary-600 active:bg-primary-700 text-primary-foreground focus:ring-primary',
      secondary: 'bg-muted text-foreground hover:bg-border border border-border focus:ring-secondary',
      tertiary: 'text-primary hover:bg-primary-50 active:bg-primary-100 focus:ring-primary bg-transparent',
      destructive: 'bg-destructive hover:bg-red-600 active:bg-red-700 text-destructive-foreground focus:ring-destructive',
    };
    
    // sizes
    const sizes = {
      sm: 'px-3 py-1 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-lg',
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
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />
        )}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
