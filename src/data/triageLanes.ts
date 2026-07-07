import type { TriageLane, DemoMode } from '../types'

export const TRIAGE_LANE_INFO: Record<
  TriageLane,
  { label: string; scale: string; scaleAbbrev: string; summary: string }
> = {
  instant: {
    label: 'Instant',
    scale: 'Up to 1,000 records',
    scaleAbbrev: '≤1K',
    summary: 'Fast answers for smaller datasets that fit in a live dashboard.',
  },
  background: {
    label: 'Background',
    scale: 'Tens of thousands of records',
    scaleAbbrev: '10K+',
    summary: 'Larger pulls that run asynchronously while you keep working.',
  },
  export: {
    label: 'Export',
    scale: 'Millions of records',
    scaleAbbrev: '1M+',
    summary: 'Very large result sets delivered as a downloadable file.',
  },
}

export const REUSED_REPORT_INFO = {
  label: 'Existing report',
  scaleAbbrev: 'Lib',
  summary: 'Matches a report already in the library instead of generating a new one.',
}

export function getTriageExplanation(triageLane: TriageLane): string | null {
  if (triageLane === 'background') {
    return `Running in the background because this pull spans ${TRIAGE_LANE_INFO.background.scale.toLowerCase()} — more than an instant report can return in one pass.`
  }
  if (triageLane === 'export') {
    return `Delivered as an export because the result set is ${TRIAGE_LANE_INFO.export.scale.toLowerCase()} — too large to show as dashboard tiles.`
  }
  return null
}

export function getDemoModeInitials(mode: DemoMode | null): string {
  if (mode === null) return 'AU'
  if (mode === 'reused') {
    return REUSED_REPORT_INFO.label
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return TRIAGE_LANE_INFO[mode].label.slice(0, 2).toUpperCase()
}
