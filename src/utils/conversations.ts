import type { Conversation, Version } from '../types'

export function getConversationPinVersion(conversation: Conversation) {
  return (
    conversation.versions.find((v) => v.favorited && v.bookmarkName) ??
    conversation.versions.find((v) => v.favorited)
  )
}

export function getConversationLabel(conversation: Conversation): string {
  const bookmarked = conversation.versions.find((v) => v.favorited && v.bookmarkName)
  if (bookmarked?.bookmarkName) return bookmarked.bookmarkName
  return conversation.title
}

export function upsertConversation(
  conversations: Conversation[],
  id: string,
  versions: Version[],
): Conversation[] {
  if (versions.length === 0) return conversations

  const existing = conversations.find((c) => c.id === id)
  const pinned = versions.some((v) => v.favorited) || existing?.pinned || false
  const updated: Conversation = {
    id,
    title: versions[0].question,
    versions: versions.map((v) => ({ ...v })),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned,
  }

  return [updated, ...conversations.filter((c) => c.id !== id)]
}

export function syncConversationPin(
  conversations: Conversation[],
  conversationId: string | null,
  versions: Version[],
): Conversation[] {
  if (!conversationId) return conversations
  const pinned = versions.some((v) => v.favorited)
  return conversations.map((c) =>
    c.id === conversationId ? { ...c, pinned, versions: versions.map((v) => ({ ...v })) } : c,
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
