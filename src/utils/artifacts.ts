import type { Report, Version } from '../types'

export type ArtifactKind = 'dashboard' | 'export'

export function getArtifactKind(version: Pick<Version, 'report'> | null | undefined): ArtifactKind {
  if (version?.report.triageLane === 'export') return 'export'
  return 'dashboard'
}

export function getArtifactTypeLabel(kind: ArtifactKind): string {
  return kind === 'export' ? 'CSV' : 'Dashboard'
}

export function getArtifactDisplayName(version: Version): string {
  if (version.bookmarkName?.trim()) return version.bookmarkName.trim()
  if (getArtifactKind(version) === 'export' && version.report.exportFileName) {
    return version.report.exportFileName
  }
  return version.question
}

export function suggestArtifactName(version: Version): string {
  if (getArtifactKind(version) === 'export') {
    return version.report.exportFileName ?? `${version.report.domain}_export.csv`
  }

  const summary = version.summary
  if (summary) {
    const condensed = summary.replace(/\.$/, '').trim()
    if (condensed.length <= 80) return condensed
  }

  let name = version.question.trim().replace(/\?+$/, '')
  name = name.replace(
    /^(what is|what are|what's|how is|how are|how|show me|can you|please|give me|tell me)\s+(the\s+)?/i,
    '',
  )
  name = name.charAt(0).toUpperCase() + name.slice(1)
  if (name.length > 80) return `${name.slice(0, 77)}…`
  return name
}

export function reportIsExport(report: Report): boolean {
  return report.triageLane === 'export'
}
