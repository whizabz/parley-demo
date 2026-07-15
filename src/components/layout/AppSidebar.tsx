import { useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { FileSpreadsheet, LayoutDashboard, Search, SquarePen, X } from 'lucide-react'
import type { Conversation, Version } from '../../types'
import { useAppStore, useFavoritedVersions } from '../../store/appStore'
import { getConversationLabel } from '../../utils/conversations'
import { getArtifactDisplayName, getArtifactKind } from '../../utils/artifacts'
import { ArtifactMenu } from '../shared/ArtifactMenu'
import { ConversationMenu } from './ConversationMenu'

const ARTIFACTS_SIDEBAR_LIMIT = 3

function byActivity(a: Conversation, b: Conversation) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

function byPinOrder(a: Conversation, b: Conversation) {
  const orderDelta =
    (a.pinOrder ?? Number.MAX_SAFE_INTEGER) - (b.pinOrder ?? Number.MAX_SAFE_INTEGER)
  if (orderDelta !== 0) return orderDelta
  return new Date(b.pinnedAt ?? b.updatedAt).getTime() - new Date(a.pinnedAt ?? a.updatedAt).getTime()
}

function ConversationList({
  items,
  activeConversationId,
  loadingConversationId,
  onSelect,
  emptyMessage,
  reorderable = false,
  onReorder,
}: {
  items: Conversation[]
  activeConversationId: string | null
  loadingConversationId: string | null
  onSelect: (id: string) => void
  emptyMessage?: string
  reorderable?: boolean
  onReorder?: (orderedIds: string[]) => void
}) {
  const dragIdRef = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-border-form">
        {emptyMessage ?? 'No conversations yet'}
      </p>
    )
  }

  const moveBefore = (fromId: string, toId: string) => {
    if (!onReorder || fromId === toId) return
    const ids = items.map((c) => c.id)
    const fromIndex = ids.indexOf(fromId)
    const toIndex = ids.indexOf(toId)
    if (fromIndex < 0 || toIndex < 0) return
    const next = [...ids]
    next.splice(fromIndex, 1)
    next.splice(toIndex, 0, fromId)
    onReorder(next)
  }

  return (
    <ul className="space-y-0.5">
      {items.map((conversation) => {
        const active = conversation.id === activeConversationId
        const ready = !!conversation.hasUnread
        const working = loadingConversationId === conversation.id && !ready
        const label = getConversationLabel(conversation)
        const isDragOver = reorderable && dragOverId === conversation.id

        return (
          <li
            key={conversation.id}
            className={`group relative ${isDragOver ? 'rounded-lg ring-1 ring-brand/25' : ''}`}
            draggable={reorderable}
            onDragStart={(event: DragEvent<HTMLLIElement>) => {
              if (!reorderable) return
              dragIdRef.current = conversation.id
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', conversation.id)
            }}
            onDragEnd={() => {
              dragIdRef.current = null
              setDragOverId(null)
            }}
            onDragOver={(event: DragEvent<HTMLLIElement>) => {
              if (!reorderable || !dragIdRef.current) return
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
              if (dragOverId !== conversation.id) setDragOverId(conversation.id)
            }}
            onDragLeave={() => {
              if (dragOverId === conversation.id) setDragOverId(null)
            }}
            onDrop={(event: DragEvent<HTMLLIElement>) => {
              if (!reorderable) return
              event.preventDefault()
              const fromId = dragIdRef.current ?? event.dataTransfer.getData('text/plain')
              setDragOverId(null)
              dragIdRef.current = null
              if (fromId) moveBefore(fromId, conversation.id)
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`flex w-full items-center gap-2 rounded-lg py-2 pl-3 pr-9 text-left text-sm transition-colors ${
                active
                  ? `bg-white shadow-sm${ready || working ? ' font-medium text-body' : ' text-brand'}`
                  : ready || working
                    ? 'font-medium text-body hover:bg-white/60'
                    : 'text-body hover:bg-white/60'
              }`}
              title={label}
              aria-label={
                ready
                  ? `${label}, new answer ready`
                  : working
                    ? `${label}, still working`
                    : label
              }
            >
              <span className="min-w-0 flex-1 truncate">{label}</span>
            </button>
            <ConversationMenu
              conversation={conversation}
              status={ready ? 'ready' : working ? 'working' : null}
            />
          </li>
        )
      })}
    </ul>
  )
}

function ArtifactList({
  items,
  onSelect,
}: {
  items: Version[]
  onSelect: (id: string) => void
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((version) => {
        const kind = getArtifactKind(version)
        const label = getArtifactDisplayName(version)
        const Icon = kind === 'export' ? FileSpreadsheet : LayoutDashboard
        return (
          <li key={version.id} className="group relative">
            <button
              type="button"
              onClick={() => onSelect(version.id)}
              className="flex w-full items-center gap-2 rounded-lg py-2 pl-3 pr-9 text-left text-sm text-body transition-colors hover:bg-white/60"
              title={label}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-border-form" />
              <span className="min-w-0 flex-1 truncate">{label}</span>
            </button>
            <ArtifactMenu version={version} />
          </li>
        )
      })}
    </ul>
  )
}

export function AppSidebar() {
  const conversations = useAppStore((s) => s.conversations)
  const activeConversationId = useAppStore((s) => s.activeConversationId)
  const loadingConversationId = useAppStore((s) => s.loadingConversationId)
  const view = useAppStore((s) => s.view)
  const loadConversation = useAppStore((s) => s.loadConversation)
  const loadSavedReport = useAppStore((s) => s.loadSavedReport)
  const openLibrary = useAppStore((s) => s.openLibrary)
  const startNewChat = useAppStore((s) => s.startNewChat)
  const reorderPinnedConversations = useAppStore((s) => s.reorderPinnedConversations)
  const favorited = useFavoritedVersions()
  const [query, setQuery] = useState('')

  const { pinned, recent, isFiltering } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (c: Conversation) =>
      !q || getConversationLabel(c).toLowerCase().includes(q)
    const active = conversations.filter((c) => !c.archived)

    return {
      pinned: active.filter((c) => c.pinned).filter(matches).sort(byPinOrder),
      recent: active.filter((c) => !c.pinned).filter(matches).sort(byActivity),
      isFiltering: q.length > 0,
    }
  }, [conversations, query])

  const recentArtifacts = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...favorited].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    const filtered = !q
      ? sorted
      : sorted.filter((v) => getArtifactDisplayName(v).toLowerCase().includes(q))
    return filtered.slice(0, ARTIFACTS_SIDEBAR_LIMIT)
  }, [favorited, query])

  const noResults =
    isFiltering && pinned.length === 0 && recent.length === 0 && recentArtifacts.length === 0
  const hasQuery = query.length > 0
  const newChatSelected = view === 'home' && activeConversationId === null
  const showArtifactsSection = favorited.length > 0 && (!isFiltering || recentArtifacts.length > 0)

  const clearSearch = () => setQuery('')

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      clearSearch()
    }
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-border/40 bg-surface px-2 pb-4 pt-3">
      <div className="relative mb-3 shrink-0 px-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-border-form" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder="Search"
          className={`w-full rounded-xl bg-white py-2.5 pl-9 text-sm text-body outline-none placeholder:text-border-form focus:ring-1 focus:ring-brand/20 ${
            hasQuery ? 'pr-9' : 'pr-3'
          }`}
        />
        {hasQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-border-form transition-colors hover:bg-surface hover:text-brand"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mb-3 shrink-0 px-1">
        <button
          type="button"
          onClick={startNewChat}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            newChatSelected
              ? 'bg-white text-brand shadow-sm'
              : 'text-body hover:bg-white/60'
          }`}
        >
          <SquarePen className="h-4 w-4 shrink-0" />
          New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1">
        {noResults ? (
          <p className="px-3 py-2 text-xs text-border-form">No results found</p>
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
                  loadingConversationId={loadingConversationId}
                  onSelect={loadConversation}
                  reorderable={!isFiltering}
                  onReorder={reorderPinnedConversations}
                />
              </section>
            )}

            {showArtifactsSection && (
              <section className="mb-3">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-border-form">
                    Artifacts
                  </p>
                  <button
                    type="button"
                    onClick={openLibrary}
                    className="text-[10px] font-medium text-accent hover:underline"
                  >
                    View all
                  </button>
                </div>
                {recentArtifacts.length > 0 ? (
                  <ArtifactList items={recentArtifacts} onSelect={loadSavedReport} />
                ) : (
                  <p className="px-3 py-2 text-xs text-border-form">No matching artifacts</p>
                )}
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
                  loadingConversationId={loadingConversationId}
                  onSelect={loadConversation}
                  emptyMessage="No conversations yet"
                />
              </section>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
