import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
          {props.required && (
            <span className="ml-1 text-[#E76F51]" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'rounded-lg border px-3 py-2.5 text-base text-text-primary',
            'placeholder:text-text-muted',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#276749] focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:bg-brand-surface disabled:text-text-muted',
            error
              ? 'border-red-500 bg-red-50'
              : 'border-brand-border bg-white hover:border-[#276749]',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          {...props}
        />

        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-sm text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
