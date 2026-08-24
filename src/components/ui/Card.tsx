import type { ElementType, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
  as?: ElementType
}

export function Card({ children, className, as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={cn('rounded-lg border border-brand-border bg-white p-4', className)}>
      {children}
    </Tag>
  )
}
