import { useMemo, useState } from 'react'
import { Pin, PinOff, Search } from 'lucide-react'
import type { Conversation } from '../../types'
import { useAppStore } from '../../store/appStore'
import { getConversationLabel, getConversationPinVersion } from '../../utils/conversations'

function ConversationList({
  items,
  activeConversationId,
  onSelect,
  onPin,
  onUnpin,
  emptyMessage,
}: {
  items: Conversation[]
  activeConversationId: string | null
  onSelect: (id: string) => void
  onPin?: (id: string) => void
  onUnpin?: (id: string) => void
  emptyMessage?: string
}) {
  if (items.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-border-form">
        {emptyMessage ?? 'No conversations yet'}
      </p>
    )
  }

  return (
    <ul className="space-y-0.5">
      {items.map((conversation) => {
        const active = conversation.id === activeConversationId
        const pinAction = onPin ? 'pin' : onUnpin ? 'unpin' : null

        return (
          <li key={conversation.id} className="group relative">
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`w-full truncate rounded-lg py-2 pl-3 text-left text-sm transition-colors ${
                pinAction ? 'pr-9' : 'pr-3'
              } ${active ? 'bg-white text-brand shadow-sm' : 'text-body hover:bg-white/60'}`}
              title={getConversationLabel(conversation)}
            >
              {getConversationLabel(conversation)}
            </button>
            {pinAction === 'pin' && onPin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onPin(conversation.id)
                }}
                className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-border-form opacity-0 transition-opacity hover:bg-white hover:text-brand group-hover:opacity-100"
                aria-label="Pin chat"
              >
                <Pin className="h-3.5 w-3.5" />
              </button>
            )}
            {pinAction === 'unpin' && onUnpin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const version = getConversationPinVersion(conversation)
                  if (version) onUnpin(version.id)
                }}
                className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-border-form opacity-0 transition-opacity hover:bg-white hover:text-brand group-hover:opacity-100"
                aria-label="Unpin chat"
              >
                <PinOff className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

interface AppSidebarProps {
  open: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function AppSidebar({ open, onMouseEnter, onMouseLeave }: AppSidebarProps) {
  const conversations = useAppStore((s) => s.conversations)
  const activeConversationId = useAppStore((s) => s.activeConversationId)
  const loadConversation = useAppStore((s) => s.loadConversation)
  const pinConversation = useAppStore((s) => s.pinConversation)
  const removeBookmark = useAppStore((s) => s.removeBookmark)
  const [query, setQuery] = useState('')

  const { pinned, recent, isFiltering } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (c: Conversation) =>
      !q || getConversationLabel(c).toLowerCase().includes(q)

    return {
      pinned: conversations.filter((c) => c.pinned).filter(matches),
      recent: conversations.filter((c) => !c.pinned).filter(matches),
      isFiltering: q.length > 0,
    }
  }, [conversations, query])

  const noResults = isFiltering && pinned.length === 0 && recent.length === 0

  if (!open) return null

  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-start px-3 pb-3 pt-2"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <aside className="pointer-events-auto flex w-64 max-h-[80%] flex-col overflow-hidden rounded-2xl bg-surface px-2 pb-4 pt-3 shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="relative mb-3 shrink-0 px-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-border-form" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-xl bg-white py-2.5 pl-9 pr-3 text-sm text-body outline-none placeholder:text-border-form focus:ring-1 focus:ring-brand/20"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-1">
          {noResults ? (
            <p className="px-3 py-2 text-xs text-border-form">No chats found</p>
          ) : (
            <>
              {pinned.length > 0 && (
                <section className="mb-3">
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-border-form">
                    Pinned
                  </p>
                  <ConversationList
                    items={pinned}
                    activeConversationId={activeConversationId}
                    onSelect={loadConversation}
                    onUnpin={removeBookmark}
                  />
                </section>
              )}

              {(recent.length > 0 || !isFiltering) && (
                <section>
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-border-form">
                    Recent
                  </p>
                  <ConversationList
                    items={recent}
                    activeConversationId={activeConversationId}
                    onSelect={loadConversation}
                    onPin={pinConversation}
                    emptyMessage="No conversations yet"
                  />
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
