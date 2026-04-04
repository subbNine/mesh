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
      w-full px-3.5 py-2.5 border rounded-xl text-[15px] bg-white text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.02)]
      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200
      placeholder:text-muted-foreground/60
      disabled:bg-zinc-50 disabled:text-foreground/50 disabled:cursor-not-allowed
      ${error ? 'border-destructive ring-destructive/10 focus:ring-destructive/20 focus:border-destructive' : 'border-zinc-200 hover:border-zinc-300'}
      ${icon ? 'pl-11' : ''}
      ${className}
    `;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label className="block text-[13px] font-semibold text-foreground/80 tracking-tight">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              {icon}
            </div>
          )}
          <input ref={ref} className={inputClasses} {...props} />
        </div>
        {error && (
          <p className="text-xs font-medium text-destructive mt-1.5 animate-in fade-in slide-in-from-top-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
