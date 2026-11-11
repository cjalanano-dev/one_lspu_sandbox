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

export function getStatusBadgeClass(status: string | null | undefined): string {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'available':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'rejected':
    case 'cancelled':
    case 'unavailable':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'maintenance':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'occupied':
    case 'reserved':
      return 'bg-sky-50 text-sky-700 border-sky-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}
