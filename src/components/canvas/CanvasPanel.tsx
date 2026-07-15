import { BarChart3, Bookmark, ShieldCheck, Download, X } from 'lucide-react'
import { useAppStore, useActiveVersion, useIsActiveVersionLoading } from '../../store/appStore'
import { getArtifactKind } from '../../utils/artifacts'
import { VersionBanner } from './VersionBanner'
import { SimilarReportPrompt } from './SimilarReportPrompt'
import { ExportResult } from './ExportResult'
import { ReportNarrative } from './ReportNarrative'
import { CardGrid } from './CardGrid'
import { CanvasObjectSelection } from './CanvasObjectSelection'

interface CanvasPanelProps {
  onClose?: () => void
}

export function CanvasPanel({ onClose }: CanvasPanelProps) {
  const version = useActiveVersion()
  const simulationPhase = useAppStore((s) => s.simulationPhase)
  const openValidation = useAppStore((s) => s.openValidation)
  const addToast = useAppStore((s) => s.addToast)
  const openBookmarkPrompt = useAppStore((s) => s.openBookmarkPrompt)
  const removeBookmark = useAppStore((s) => s.removeBookmark)
  const isActiveLoading = useIsActiveVersionLoading()

  const isExport = version ? getArtifactKind(version) === 'export' : false
  const showTriagePrompt = version && simulationPhase === 'triage-prompt'
  const showExport =
    isExport && !isActiveLoading && simulationPhase === 'complete'
  const showNarrative =
    version &&
    (simulationPhase === 'revealing' || simulationPhase === 'complete')
  const showCards =
    version &&
    !isExport &&
    version.report.cards.length > 0 &&
    (!isActiveLoading || simulationPhase === 'revealing')

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <BarChart3 className="h-4 w-4 shrink-0 text-brand" />
          <span className="truncate text-sm font-medium text-brand">
            {version?.report.domain ?? 'Canvas'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {version && !isActiveLoading && simulationPhase === 'complete' && (
            <>
              <button
                type="button"
                onClick={() =>
                  version.favorited
                    ? removeBookmark(version.id)
                    : openBookmarkPrompt(version.id)
                }
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-accent hover:bg-highlight"
              >
                <Bookmark className={`h-3.5 w-3.5 ${version.favorited ? 'fill-accent' : ''}`} />
                {version.favorited ? 'Saved' : isExport ? 'Save export' : 'Save report'}
              </button>
              <button
                type="button"
                onClick={openValidation}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-accent hover:bg-highlight"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Validation
              </button>
              {!isExport && (
                <button
                  type="button"
                  onClick={() => addToast('Export started — dashboard PDF will download shortly.')}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-accent hover:bg-highlight"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              )}
            </>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-border-form transition-colors hover:bg-surface hover:text-brand"
              aria-label="Close canvas"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <VersionBanner />

      <div className="flex-1 overflow-y-auto">
        {showTriagePrompt && <SimilarReportPrompt />}

        {showNarrative && <ReportNarrative version={version} />}

        {showExport && version && (
          <ExportResult
            fileName={version.report.exportFileName ?? `${version.report.domain}_export.csv`}
            fileSize={version.report.exportFileSize ?? '1.8 MB'}
          />
        )}

        {showCards && <CardGrid />}
      </div>

      {showCards && <CanvasObjectSelection />}
    </div>
  )
}
