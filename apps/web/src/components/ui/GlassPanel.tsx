import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  variant?: 'light' | 'dark' | 'default';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ 
  children, 
  variant = 'default', 
  blur = 'xl',
  padding = 'md',
  border = true,
  className = '',
  ...props 
}) => {
  
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
  };

  const variantClasses = {
    default: 'bg-card/60',
    light: 'bg-white/40',
    dark: 'bg-black/40',
  };

  const borderClass = border ? 'border border-border/40' : '';

  return (
    <motion.div
      className={`rounded-[32px] shadow-2xl transition-all duration-500 ${variantClasses[variant]} ${blurClasses[blur]} ${paddingClasses[padding]} ${borderClass} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
