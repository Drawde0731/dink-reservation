import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#E76F51] text-white hover:bg-[#d4623f] active:bg-[#c0572e] ' +
    'disabled:bg-brand-disabled disabled:text-white',
  secondary:
    'bg-brand-green-light text-text-primary hover:bg-[#92c5a6] active:bg-[#7db391] ' +
    'disabled:bg-brand-disabled disabled:text-text-muted',
  ghost:
    'bg-transparent text-text-primary hover:bg-brand-surface active:bg-brand-border ' +
    'disabled:text-brand-disabled',
  destructive:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ' +
    'disabled:bg-brand-disabled disabled:text-white',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-5 py-2.5 text-base min-h-[44px]',
  lg: 'px-6 py-3 text-lg min-h-[52px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#276749] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  ),
)
Button.displayName = 'Button'
