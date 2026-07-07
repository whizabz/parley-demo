import type { NarrativeSegment } from '../types'

export function getNarrativeSnippet(segments: NarrativeSegment[]): string {
  if (segments.length === 0) return ''
  return segments
    .slice(0, 2)
    .map((s) => s.text)
    .join(' ')
}
