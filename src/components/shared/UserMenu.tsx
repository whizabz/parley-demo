import { useEffect, useMemo, useRef, useState } from 'react'
import { Archive, ArchiveRestore, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import {
  formatLimitResetIn,
  getCreditsBarColor,
  getCreditsUsedPercent,
} from '../../utils/credits'
import { getConversationLabel } from '../../utils/conversations'

function formatArchivedAt(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<'main' | 'archived'>('main')
  const [resetLabel, setResetLabel] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const creditsUsed = useAppStore((s) => s.creditsUsed)
  const creditsTotal = useAppStore((s) => s.creditsTotal)
  const creditsResetAt = useAppStore((s) => s.creditsResetAt)
  const shuffleCreditsUsage = useAppStore((s) => s.shuffleCreditsUsage)
  const conversations = useAppStore((s) => s.conversations)
  const loadConversation = useAppStore((s) => s.loadConversation)
  const unarchiveConversation = useAppStore((s) => s.unarchiveConversation)

  const usedPct = getCreditsUsedPercent(creditsUsed, creditsTotal)
  const barColor = getCreditsBarColor(usedPct)

  const archived = useMemo(
    () =>
      conversations
        .filter((c) => c.archived)
        .sort(
          (a, b) =>
            new Date(b.archivedAt ?? b.updatedAt).getTime() -
            new Date(a.archivedAt ?? a.updatedAt).getTime(),
        ),
    [conversations],
  )

  useEffect(() => {
    const updateResetLabel = () => setResetLabel(formatLimitResetIn(creditsResetAt))
    updateResetLabel()
    const interval = setInterval(updateResetLabel, 60_000)
    return () => clearInterval(interval)
  }, [creditsResetAt])

  useEffect(() => {
    if (!open) setPanel('main')
  }, [open])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white hover:opacity-90"
        aria-label="User menu"
        aria-expanded={open}
      >
        ME
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded border border-border bg-white py-1 shadow-lg">
          {panel === 'main' ? (
            <>
              <div className="border-b border-border px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-border-form">
                  Compute credits
                </p>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface"
                  onClick={() => shuffleCreditsUsage()}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${usedPct}%`, backgroundColor: barColor }}
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-brand">{usedPct}% used</p>
                <p className="mt-0.5 text-xs text-border-form">{resetLabel}</p>
              </div>

              <button
                type="button"
                onClick={() => setPanel('archived')}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-body hover:bg-surface"
              >
                <span className="flex items-center gap-2">
                  <Archive className="h-3.5 w-3.5 text-border-form" />
                  Archived chats
                </span>
                <span className="flex items-center gap-1 text-xs text-border-form">
                  {archived.length > 0 ? archived.length : null}
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPanel('main')}
                className="flex w-full items-center gap-2 border-b border-border px-3 py-2.5 text-left text-sm font-medium text-brand hover:bg-surface"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Archived chats
              </button>
              <div className="max-h-72 overflow-y-auto py-1">
                {archived.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-border-form">No archived chats</p>
                ) : (
                  archived.map((conversation) => {
                    const label = getConversationLabel(conversation)
                    const archivedLabel = formatArchivedAt(conversation.archivedAt)
                    return (
                      <div
                        key={conversation.id}
                        className="group flex items-center gap-1 px-1.5 py-0.5"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            loadConversation(conversation.id)
                            setOpen(false)
                          }}
                          className="min-w-0 flex-1 rounded-md px-2 py-2 text-left hover:bg-surface"
                          title={label}
                        >
                          <span className="block truncate text-sm text-body">{label}</span>
                          {archivedLabel && (
                            <span className="mt-0.5 block text-[11px] text-border-form">
                              Archived {archivedLabel}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => unarchiveConversation(conversation.id)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-border-form hover:bg-surface hover:text-brand"
                          aria-label={`Restore ${label}`}
                          title="Restore"
                        >
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
