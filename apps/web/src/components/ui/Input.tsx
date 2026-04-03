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
      w-full px-3 py-2 border rounded-lg text-base bg-card text-foreground
      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
      placeholder:text-foreground/50 transition-colors
      disabled:bg-muted disabled:text-foreground/50 disabled:cursor-not-allowed
      ${error ? 'border-destructive ring-destructive/10 focus:ring-destructive' : 'border-border'}
      ${icon ? 'pl-10' : ''}
      ${className}
    `;

    return (
      <div className={`space-y-2 ${containerClassName}`}>
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">
              {icon}
            </div>
          )}
          <input ref={ref} className={inputClasses} {...props} />
        </div>
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
