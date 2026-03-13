'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-deep)] hover:from-[var(--color-primary-hover)] hover:to-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/10 hover:shadow-lg hover:shadow-[var(--color-primary)]/20',
  secondary: 'bg-[var(--bg-surface-hover)] hover:bg-[var(--border-default)] text-[var(--text-primary)] border border-[var(--border-default)]',
  ghost: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
  danger: 'bg-[var(--color-error)] hover:bg-[var(--color-error)]/80 text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
