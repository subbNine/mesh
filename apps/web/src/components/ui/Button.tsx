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
      primary: 'bg-primary text-primary-foreground shadow-[0_8px_30px_rgb(59,130,246,0.3)] hover:bg-primary/90 hover:shadow-[0_12px_40px_rgb(59,130,246,0.4)] border border-primary/20',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50 shadow-sm',
      tertiary: 'text-muted-foreground hover:text-foreground hover:bg-white/5 bg-transparent',
      outline: 'bg-transparent text-foreground border-2 border-foreground/10 hover:border-primary/40 hover:text-primary transition-colors',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/30',
    };
    
    const sizes = {
      sm: 'h-9 px-4 text-[11px] uppercase tracking-widest',
      md: 'h-11 px-6 text-xs uppercase tracking-widest',
      lg: 'h-14 px-8 text-sm uppercase tracking-widest',
      xl: 'h-16 px-10 text-base uppercase tracking-widest',
    };
    
    const widthClass = fullWidth ? 'w-full' : '';

    const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...buttonProps } = props as any;

    return (
      <motion.button
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.96 }}
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
