import type { Version } from '../../types'
import { getArtifactDisplayName } from '../../utils/artifacts'
import { NarrativeText } from '../chat/NarrativeText'

interface Props {
  version: Version
  showNarrative?: boolean
}

export function ReportNarrative({ version, showNarrative = true }: Props) {
  if (!showNarrative) return null

  const title = getArtifactDisplayName(version)
  const showHeader = version.report.originalReportRef

  return (
    <div className="p-6 pb-0">
      <div className="rounded border border-border bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-brand">{title}</h2>
        {showHeader && (
          <div className="mt-2">
            <span className="text-xs text-border-form">
              Originally by {version.report.originalReportRef!.createdBy} ·{' '}
              {new Date(version.report.originalReportRef!.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
        <div className="mt-3">
          <NarrativeText segments={version.narrative} />
        </div>
      </div>
    </div>
  )
}
