import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatTimeOnly(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/**
 * Status badge classes.
 *
 * Approved/available carry the blue accent; every other state stays
 * monochrome, and state is always conveyed by fill + label + icon rather
 * than by hue alone.
 */
export function getStatusBadgeClass(status: string | null | undefined): string {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'available':
      return 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
    case 'pending':
      return 'bg-transparent text-[var(--accent-text)] border-[var(--accent)]'
    case 'rejected':
    case 'cancelled':
    case 'unavailable':
      return 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--line)]'
    case 'maintenance':
      return 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--line)]'
    case 'occupied':
    case 'reserved':
      return 'bg-[var(--surface-2)] text-[var(--ink)] border-[var(--line-strong)]'
    default:
      return 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--line)]'
  }
}
