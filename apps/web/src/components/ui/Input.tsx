import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, containerClassName = '', ...props }, ref) => {
    
    // Theme-aware input classes:
    // Fixed "bg-white" contrast bug by switching to theme-aware "bg-card/40" or "bg-muted/20"
    const inputClasses = `
      w-full px-5 py-3.5 border rounded-2xl text-[15px] bg-muted/20 text-foreground shadow-sm
      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300
      placeholder:text-muted-foreground/30
      disabled:bg-muted/10 disabled:text-foreground/30 disabled:cursor-not-allowed
      ${error ? 'border-destructive ring-destructive/10 focus:ring-destructive/20 focus:border-destructive' : 'border-border/40 hover:border-border'}
      ${icon ? 'pl-12' : ''}
      ${className}
    `;

    return (
      <div className={`space-y-2 ${containerClassName}`}>
        {label && (
          <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              {icon}
            </div>
          )}
          <input 
            ref={ref} 
            className={inputClasses} 
            {...props} 
          />
        </div>
        {error && (
          <p className="text-[10px] font-black text-destructive mt-2 pl-1 animate-in fade-in slide-in-from-top-1">
            {error.toUpperCase()}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
