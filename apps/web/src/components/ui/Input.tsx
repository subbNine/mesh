import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, containerClassName = '', ...props }, ref) => {
    const inputClasses = `
      w-full rounded-xl border bg-card px-4 py-3 text-[15px] text-foreground shadow-sm
      transition-all duration-200 placeholder:text-muted-foreground/60
      focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10
      disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground
      ${error ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : 'border-border/80 hover:border-border'}
      ${icon ? 'pl-11' : ''}
      ${className}
    `;

    return (
      <div className={`space-y-2 ${containerClassName}`}>
        {label && (
          <label className="block pl-0.5 text-[11px] font-semibold text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
              {icon}
            </div>
          )}
          <input ref={ref} className={inputClasses} {...props} />
        </div>
        {error && (
          <p className="pl-0.5 text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
