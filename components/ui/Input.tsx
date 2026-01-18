'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', leftIcon, error, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-surface border border-border rounded-lg
            text-text-primary placeholder:text-text-secondary
            focus:outline-none focus:ring-2 focus:ring-bullish/50 focus:border-bullish
            transition-colors
            ${leftIcon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
            ${error ? 'border-bearish focus:ring-bearish/50 focus:border-bearish' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-bearish">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>((props, ref) => (
  <Input ref={ref} leftIcon={<Search size={18} />} placeholder="Search markets..." {...props} />
));

SearchInput.displayName = 'SearchInput';

export { Input, SearchInput };
export type { InputProps };
