import type { Conversation, Version } from '../types'

export function getConversationLabel(conversation: Conversation): string {
  if (conversation.customTitle?.trim()) return conversation.customTitle.trim()
  return conversation.title
}

export function upsertConversation(
  conversations: Conversation[],
  id: string,
  versions: Version[],
  options?: { touchActivity?: boolean },
): Conversation[] {
  if (versions.length === 0) return conversations

  const existing = conversations.find((c) => c.id === id)
  const touchActivity = options?.touchActivity ?? false
  const updated: Conversation = {
    id,
    title: versions[0].question,
    versions: versions.map((v) => ({ ...v })),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: touchActivity
      ? new Date().toISOString()
      : (existing?.updatedAt ?? new Date().toISOString()),
    pinned: existing?.archived ? false : (existing?.pinned ?? false),
    pinnedAt: existing?.archived ? undefined : existing?.pinnedAt,
    pinOrder: existing?.archived ? undefined : existing?.pinOrder,
    hasUnread: existing?.hasUnread ?? false,
    customTitle: existing?.customTitle,
    archived: existing?.archived ?? false,
  }

  return [updated, ...conversations.filter((c) => c.id !== id)]
}

export function setConversationUnread(
  conversations: Conversation[],
  conversationId: string,
  hasUnread: boolean,
): Conversation[] {
  return conversations.map((c) =>
    c.id === conversationId ? { ...c, hasUnread } : c,
  )
}

/** Syncs version snapshots into a conversation without changing pin or activity. */
export function syncConversationVersions(
  conversations: Conversation[],
  conversationId: string | null,
  versions: Version[],
): Conversation[] {
  if (!conversationId) return conversations
  return conversations.map((c) =>
    c.id === conversationId ? { ...c, versions: versions.map((v) => ({ ...v })) } : c,
  )
}

export function compactPinOrders(conversations: Conversation[]): Conversation[] {
  const pinned = conversations
    .filter((c) => c.pinned && !c.archived)
    .sort((a, b) => {
      const orderDelta = (a.pinOrder ?? Number.MAX_SAFE_INTEGER) - (b.pinOrder ?? Number.MAX_SAFE_INTEGER)
      if (orderDelta !== 0) return orderDelta
      return new Date(b.pinnedAt ?? b.updatedAt).getTime() - new Date(a.pinnedAt ?? a.updatedAt).getTime()
    })

  const orderMap = new Map(pinned.map((c, index) => [c.id, index]))
  return conversations.map((c) =>
    orderMap.has(c.id) ? { ...c, pinOrder: orderMap.get(c.id)! } : c,
  )
}

export function formatConversationAge(isoDate: string, now = Date.now()): string {
  const then = new Date(isoDate).getTime()
  const diffMs = now - then
  const days = Math.floor(diffMs / 86_400_000)

  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'Past week'
  if (days < 30) return 'Past month'
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
