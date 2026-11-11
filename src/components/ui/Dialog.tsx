import { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  titleId: string
  children: React.ReactNode
}

const FOCUSABLE_SELECTORS =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function Dialog({ isOpen, onClose, title, titleId, children }: DialogProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<Element | null>(null)

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current) return
    const focusable = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        ;(last as HTMLElement)?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        ;(first as HTMLElement)?.focus()
      }
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      trapFocus(e as unknown as KeyboardEvent)
    },
    [onClose, trapFocus]
  )

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as Element | null

    const modal = document.getElementById('dialog-root')
    if (!modal) return

    const focusable = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ;(focusable?.[0] as HTMLElement | undefined)?.focus()

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
      ;(previousFocusRef.current as HTMLElement | null)?.focus({ preventScroll: true })
      previousFocusRef.current = null
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          ref={containerRef}
          className="bg-white rounded-[var(--radius)] max-w-md w-full p-6  border border-[var(--line)] relative"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onKeyDown={handleKeyDown}
        >
          <h3 id={titleId} className="text-base font-bold text-[var(--ink)] mb-1">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-sm text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
          {children}
        </div>
      </div>
    </>,
    document.getElementById('dialog-root') ?? document.body
  )
}
