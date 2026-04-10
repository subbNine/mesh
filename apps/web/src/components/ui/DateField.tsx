import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { format, isValid, parse } from 'date-fns';
import { CalendarDays } from 'lucide-react';

type DateFieldProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  ariaLabel?: string;
}>;

const DATE_FORMAT = 'yyyy-MM-dd';

const toDateDraft = (rawValue: string) => {
  const digits = rawValue.replace(/\D/g, '').slice(0, 8);

  if (digits.length === 0) return '';
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

const isValidDateValue = (value: string) => {
  const parsed = parse(value, DATE_FORMAT, new Date());
  return isValid(parsed) && format(parsed, DATE_FORMAT) === value;
};

export function DateField({
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
  className = '',
  inputClassName = '',
  disabled = false,
  min,
  max,
  ariaLabel = 'Choose a date',
}: DateFieldProps) {
  const [draftValue, setDraftValue] = useState(value);
  const nativePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  const commitDraftValue = (nextValue: string) => {
    if (!nextValue) {
      onChange('');
      return true;
    }

    if (isValidDateValue(nextValue)) {
      onChange(nextValue);
      return true;
    }

    return false;
  };

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = toDateDraft(event.target.value);
    setDraftValue(nextValue);

    if (!nextValue) {
      onChange('');
      return;
    }

    if (nextValue.length === 10) {
      commitDraftValue(nextValue);
    }
  };

  const handleBlur = () => {
    if (!draftValue) {
      onChange('');
      return;
    }

    if (!commitDraftValue(draftValue)) {
      setDraftValue(value);
    }
  };

  const openNativePicker = () => {
    if (disabled) return;

    const picker = nativePickerRef.current;
    if (!picker) return;

    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
      return;
    }

    picker.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        value={draftValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2 pr-10 text-sm text-foreground outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${inputClassName}`}
      />

      <button
        type="button"
        onClick={openNativePicker}
        disabled={disabled}
        aria-label={ariaLabel}
        className="absolute inset-y-1.5 right-1.5 inline-flex items-center justify-center rounded-lg px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CalendarDays size={14} />
      </button>

      <input
        ref={nativePickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraftValue(nextValue);
          onChange(nextValue);
        }}
        className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 opacity-0"
      />
    </div>
  );
}
