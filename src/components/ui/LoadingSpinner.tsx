import { cn } from '../../lib/cn'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const sizePx = { sm: 24, md: 40, lg: 56 }

// Pickleball ball — recreated as SVG, used as the app-wide spinner.
function PickleballSVG({ px }: { px: number }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Body */}
      <circle cx="50" cy="50" r="46" fill="#9DC41A" stroke="#1B6B2E" strokeWidth="5" />
      {/* Gloss highlight */}
      <ellipse cx="36" cy="30" rx="13" ry="8" fill="rgba(255,255,255,0.18)" transform="rotate(-30 36 30)" />

      {/* Holes — 1 center circle + 8 ovals around it */}
      {/* Center */}
      <circle cx="50" cy="50" r="10" fill="#1B6B2E" />
      {/* Top */}
      <ellipse cx="50" cy="19" rx="8" ry="5" fill="#1B6B2E" />
      {/* Bottom */}
      <ellipse cx="50" cy="81" rx="8" ry="5" fill="#1B6B2E" />
      {/* Left */}
      <ellipse cx="19" cy="50" rx="5" ry="8" fill="#1B6B2E" />
      {/* Right */}
      <ellipse cx="81" cy="50" rx="5" ry="8" fill="#1B6B2E" />
      {/* Top-left */}
      <ellipse cx="27" cy="27" rx="7.5" ry="4.5" fill="#1B6B2E" transform="rotate(-45 27 27)" />
      {/* Top-right */}
      <ellipse cx="73" cy="27" rx="7.5" ry="4.5" fill="#1B6B2E" transform="rotate(45 73 27)" />
      {/* Bottom-left */}
      <ellipse cx="27" cy="73" rx="7.5" ry="4.5" fill="#1B6B2E" transform="rotate(45 27 73)" />
      {/* Bottom-right */}
      <ellipse cx="73" cy="73" rx="7.5" ry="4.5" fill="#1B6B2E" transform="rotate(-45 73 73)" />
    </svg>
  )
}

export function LoadingSpinner({
  size = 'md',
  label = 'Loading…',
  className,
}: LoadingSpinnerProps) {
  const px = sizePx[size]
  return (
    <div
      role="status"
      className={cn('flex flex-col items-center justify-center gap-2', className)}
    >
      <span
        className="block"
        style={{ animation: 'spin 1.4s linear infinite', width: px, height: px }}
      >
        <PickleballSVG px={px} />
      </span>
      <span className="sr-only">{label}</span>
    </div>
  )
}
