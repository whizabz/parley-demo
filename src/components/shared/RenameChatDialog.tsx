import { useEffect, useRef, useState } from 'react'

interface RenameChatDialogProps {
  open: boolean
  initialName: string
  onSave: (name: string) => void
  onCancel: () => void
  title?: string
  description?: string
  fieldLabel?: string
  placeholder?: string
}

export function RenameChatDialog({
  open,
  initialName,
  onSave,
  onCancel,
  title = 'Rename chat',
  description = 'Choose a name you’ll recognize later.',
  fieldLabel = 'Chat name',
  placeholder = 'Name this chat',
}: RenameChatDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(initialName)

  useEffect(() => {
    if (!open) return
    setName(initialName)
    const timer = setTimeout(() => inputRef.current?.select(), 50)
    return () => clearTimeout(timer)
  }, [open, initialName])

  if (!open) return null

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
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
        aria-labelledby="rename-dialog-title"
        className="relative w-full max-w-sm rounded border border-border bg-white p-6 shadow-xl"
      >
        <h3 id="rename-dialog-title" className="font-serif text-lg text-brand">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-body">{description}</p>
        <label className="mt-4 block">
          <span className="text-xs font-medium text-border-form">{fieldLabel}</span>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') onCancel()
            }}
            className="mt-1 w-full rounded border border-border-form/40 px-3 py-2 text-sm text-body outline-none focus:border-accent"
            placeholder={placeholder}
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
