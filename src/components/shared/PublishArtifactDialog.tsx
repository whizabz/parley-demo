import { useEffect, useRef, useState } from 'react'
import { FileSpreadsheet, LayoutDashboard } from 'lucide-react'
import type { Version } from '../../types'
import { getArtifactDisplayName, getArtifactKind, getArtifactTypeLabel } from '../../utils/artifacts'

interface PublishArtifactDialogProps {
  open: boolean
  version: Version
  onCancel: () => void
  onSubmit: (comment: string) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function PublishArtifactDialog({
  open,
  version,
  onCancel,
  onSubmit,
}: PublishArtifactDialogProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [comment, setComment] = useState('')

  const kind = getArtifactKind(version)
  const label = getArtifactDisplayName(version)
  const typeLabel = getArtifactTypeLabel(kind)
  const Icon = kind === 'export' ? FileSpreadsheet : LayoutDashboard

  useEffect(() => {
    if (!open) return
    setComment('')
    const timer = setTimeout(() => textareaRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [open, version.id])

  if (!open) return null

  const trimmed = comment.trim()

  const handleSubmit = () => {
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={onCancel}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-artifact-dialog-title"
        className="relative w-full max-w-md rounded border border-border bg-white p-6 shadow-xl"
      >
        <h3 id="publish-artifact-dialog-title" className="font-serif text-lg text-brand">
          Submit for publish
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-body">
          Publishing goes through governance review before this {typeLabel.toLowerCase()} becomes
          available more widely.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-lg bg-surface px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand">
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-brand">{label}</span>
            <span className="mt-0.5 flex items-center gap-2 text-[11px] text-border-form">
              <span>{typeLabel}</span>
              <span aria-hidden>·</span>
              <span>{formatDate(version.createdAt)}</span>
            </span>
          </span>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-border-form">Comments</span>
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onCancel()
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
            rows={4}
            className="mt-1 w-full resize-none rounded border border-border-form/40 px-3 py-2 text-sm text-body outline-none focus:border-accent"
            placeholder="Context for reviewers (required)"
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-border px-4 py-2 text-sm text-body hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!trimmed}
            className="rounded bg-brand px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            Submit for review
          </button>
        </div>
      </div>
    </div>
  )
}
