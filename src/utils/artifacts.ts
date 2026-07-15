import type { Report, Version } from '../types'

export type ArtifactKind = 'report' | 'export'

export function getArtifactKind(version: Pick<Version, 'report'> | null | undefined): ArtifactKind {
  if (version?.report.triageLane === 'export') return 'export'
  return 'report'
}

export function getArtifactTypeLabel(kind: ArtifactKind): string {
  return kind === 'export' ? 'CSV' : 'Report'
}

export function getArtifactDisplayName(version: Version): string {
  if (version.bookmarkName?.trim()) return version.bookmarkName.trim()
  return suggestArtifactName(version)
}

function shortenResponseTitle(summary: string): string {
  const clean = summary.replace(/\.$/, '').trim()
  if (!clean) return ''

  // Prefer the lead clause of the response (before dash/colon/comma elaboration).
  const lead =
    clean.split(/\s+[—–]\s+|:\s+/)[0]?.trim() ||
    clean.split(/,\s+/)[0]?.trim() ||
    clean

  if (lead.length <= 48) return lead
  if (clean.length <= 48) return clean
  return `${clean.slice(0, 45).trimEnd()}…`
}

export function suggestArtifactName(version: Version): string {
  if (getArtifactKind(version) === 'export') {
    return version.report.exportFileName ?? `${version.report.domain}_export.csv`
  }

  const fromResponse = shortenResponseTitle(version.summary ?? '')
  if (fromResponse) return fromResponse

  let name = version.question.trim().replace(/\?+$/, '')
  name = name.replace(
    /^(what is|what are|what's|how is|how are|how|show me|can you|please|give me|tell me)\s+(the\s+)?/i,
    '',
  )
  name = name.charAt(0).toUpperCase() + name.slice(1)
  if (name.length > 48) return `${name.slice(0, 45).trimEnd()}…`
  return name
}

export function reportIsExport(report: Report): boolean {
  return report.triageLane === 'export'
}
