import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ExpandModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function ExpandModal({ open, title, onClose, children }: ExpandModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close expanded view"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expand-modal-title"
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded border border-border bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="expand-modal-title" className="font-serif text-xl text-brand">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
      </div>
    </div>
  )
}
