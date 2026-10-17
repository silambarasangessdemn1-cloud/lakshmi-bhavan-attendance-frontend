import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberStepperProps {
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
  stepButtons?: { label: string; delta: number }[];
  prefix?: string;
  suffix?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Infinity,
  stepButtons,
  prefix,
  suffix,
  className = '',
  size = 'md',
}) => {
  const handleDelta = (delta: number) => {
    const next = Math.round((Number(value || 0) + delta) * 100) / 100;
    const clamped = Math.max(min, Math.min(max, next));
    onChange(clamped);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(min);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
  };

  const isSmall = size === 'sm';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Standard decrement button */}
      <button
        type="button"
        onClick={() => handleDelta(-step)}
        disabled={value <= min}
        className={`${
          isSmall ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
        } shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-xs`}
        title={`Decrease by ${step}`}
        aria-label={`Decrease by ${step}`}
      >
        <Minus className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} />
      </button>

      {/* Numerical input */}
      <div className="relative flex-1 min-w-[70px]">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 select-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          step={step}
          min={min}
          max={max === Infinity ? undefined : max}
          value={value === 0 ? '0' : value}
          onChange={handleInputChange}
          className={`w-full text-center font-mono font-medium rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors ${
            isSmall ? 'py-1 text-xs' : 'py-2 text-sm'
          } ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-6' : ''}`}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 select-none">
            {suffix}
          </span>
        )}
      </div>

      {/* Standard increment button */}
      <button
        type="button"
        onClick={() => handleDelta(step)}
        disabled={value >= max}
        className={`${
          isSmall ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
        } shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-xs`}
        title={`Increase by ${step}`}
        aria-label={`Increase by ${step}`}
      >
        <Plus className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} />
      </button>

      {/* Optional fast presets like +1, +2 for OT */}
      {stepButtons && stepButtons.length > 0 && (
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {stepButtons.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleDelta(btn.delta)}
              className="px-2 py-1 text-xs font-mono font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200/60 transition-colors whitespace-nowrap"
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
