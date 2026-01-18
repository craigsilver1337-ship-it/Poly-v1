'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className = '', label, showValue = true, formatValue, value, ...props }, ref) => {
    const displayValue = formatValue
      ? formatValue(Number(value))
      : `${value}`;

    return (
      <div className={`space-y-2 ${className}`}>
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && <label className="text-sm text-text-secondary">{label}</label>}
            {showValue && <span className="text-sm font-medium text-text-primary">{displayValue}</span>}
          </div>
        )}
        <input
          ref={ref}
          type="range"
          value={value}
          className="
            w-full h-2 bg-border rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-bullish
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-bullish
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer
          "
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };
export type { SliderProps };
