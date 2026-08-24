import { cn } from '../../lib/cn'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
}

export function LoadingSpinner({
  size = 'md',
  label = 'Loading…',
  className,
}: LoadingSpinnerProps) {
  return (
    <div role="status" className={cn('flex items-center justify-center', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'animate-spin rounded-full border-brand-green-dark border-t-transparent',
          sizeClasses[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
