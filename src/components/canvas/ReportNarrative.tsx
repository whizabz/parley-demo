import type { Version } from '../../types'
import { NarrativeText } from '../chat/NarrativeText'

interface Props {
  version: Version
  showNarrative?: boolean
}

export function ReportNarrative({ version, showNarrative = true }: Props) {
  if (!showNarrative) return null

  const showHeader = version.report.originalReportRef

  return (
    <div className="p-6 pb-0">
      <div className="rounded border border-border bg-white p-5 shadow-sm">
        {showHeader && (
          <div className="mb-3">
            <span className="text-xs text-border-form">
              Originally by {version.report.originalReportRef!.createdBy} ·{' '}
              {new Date(version.report.originalReportRef!.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
        <NarrativeText segments={version.narrative} />
      </div>
    </div>
  )
}
