export function suggestBookmarkName(question: string, summary?: string): string {
  if (summary) {
    const condensed = summary.replace(/\.$/, '').trim()
    if (condensed.length <= 80) return condensed
  }

  let name = question.trim().replace(/\?+$/, '')
  name = name.replace(
    /^(what is|what are|what's|how is|how are|how|show me|can you|please|give me|tell me)\s+(the\s+)?/i,
    '',
  )
  name = name.charAt(0).toUpperCase() + name.slice(1)
  if (name.length > 80) return `${name.slice(0, 77)}…`
  return name
}
