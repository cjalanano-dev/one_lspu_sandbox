import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
}

export function Skeleton({ className, width = '100%', height = '1rem', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-sm bg-[var(--surface-2)] dark:bg-[var(--surface-2)]',
        className,
      )}
      style={{ width, height }}
      {...props}
    />
  )
}
