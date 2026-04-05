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
    
    const baseClasses = 'inline-flex items-center justify-center rounded-xl font-display font-black tracking-tight transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2';
    
    // Architectural Variants
    const variants = {
      primary: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50',
      tertiary: 'text-muted-foreground hover:text-foreground hover:bg-muted/50 bg-transparent',
      outline: 'bg-transparent text-foreground border-2 border-foreground/10 hover:border-foreground/20 hover:bg-muted/30',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20',
    };
    
    const sizes = {
      sm: 'h-8 px-4 text-xs',
      md: 'h-10 px-6 text-sm',
      lg: 'h-12 px-8 text-base',
      xl: 'h-14 px-10 text-lg',
    };
    
    const widthClass = fullWidth ? 'w-full' : '';

    const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...buttonProps } = props as any;

    return (
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        ref={ref as any}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        disabled={disabled || loading}
        {...buttonProps}
      >
        {loading && (
          <motion.span 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
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
