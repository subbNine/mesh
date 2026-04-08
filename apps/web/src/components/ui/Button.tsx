import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth, loading, icon, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2';

    const variants = {
      primary: 'border border-primary/20 bg-primary text-primary-foreground shadow-[0_12px_30px_-16px_rgba(39,159,189,0.65)] hover:-translate-y-0.5 hover:brightness-[1.02]',
      secondary: 'border border-border/80 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
      tertiary: 'bg-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground',
      outline: 'border border-border/80 bg-background/70 text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary',
      destructive: 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 hover:bg-destructive/90',
    };

    const sizes = {
      sm: 'h-9 px-3.5 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-5 text-sm',
      xl: 'h-12 px-6 text-base',
    };

    const widthClass = fullWidth ? 'w-full' : '';
    const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...buttonProps } = props as any;

    return (
      <motion.button
        whileHover={{ y: -1, transition: { duration: 0.16 } }}
        whileTap={{ scale: 0.98 }}
        ref={ref as any}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        disabled={disabled || loading}
        {...buttonProps}
      >
        {loading && (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent opacity-70 flex-shrink-0"
          />
        )}
        {!loading && icon && <span className="mr-2 flex-shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
