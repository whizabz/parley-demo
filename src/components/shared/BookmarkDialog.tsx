import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import {
  getArtifactKind,
  getArtifactTypeLabel,
  suggestArtifactName,
} from '../../utils/artifacts'

export function BookmarkDialog() {
  const bookmarkPromptVersionId = useAppStore((s) => s.bookmarkPromptVersionId)
  const versions = useAppStore((s) => s.versions)
  const favoritedReports = useAppStore((s) => s.favoritedReports)
  const confirmBookmark = useAppStore((s) => s.confirmBookmark)
  const cancelBookmarkPrompt = useAppStore((s) => s.cancelBookmarkPrompt)

  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')

  const version =
    bookmarkPromptVersionId != null
      ? (versions.find((v) => v.id === bookmarkPromptVersionId) ??
        favoritedReports.find((v) => v.id === bookmarkPromptVersionId) ??
        null)
      : null

  const open = bookmarkPromptVersionId != null && version != null
  const kind = version ? getArtifactKind(version) : 'dashboard'
  const typeLabel = getArtifactTypeLabel(kind)

  useEffect(() => {
    if (!open || !version) return
    setName(suggestArtifactName(version))
    const timer = setTimeout(() => inputRef.current?.select(), 50)
    return () => clearTimeout(timer)
  }, [open, version])

  if (!open || !version) return null

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    confirmBookmark(trimmed)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={cancelBookmarkPrompt}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-artifact-dialog-title"
        className="relative w-full max-w-sm rounded border border-border bg-white p-6 shadow-xl"
      >
        <h3 id="save-artifact-dialog-title" className="font-serif text-lg text-brand">
          {kind === 'export' ? 'Save export' : 'Save report'}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-body">
          Add this {typeLabel.toLowerCase()} to your library so you can reopen it later.
        </p>
        <label className="mt-4 block">
          <span className="text-xs font-medium text-border-form">Name</span>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') cancelBookmarkPrompt()
            }}
            className="mt-1 w-full rounded border border-border-form/40 px-3 py-2 text-sm text-body outline-none focus:border-accent"
            placeholder={kind === 'export' ? 'Name this export' : 'Name this report'}
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelBookmarkPrompt}
            className="rounded border border-border px-4 py-2 text-sm text-body hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="rounded bg-brand px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
