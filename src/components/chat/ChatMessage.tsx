import { BarChart3 } from 'lucide-react'
import type { Version } from '../../types'
import { useAppStore, useIsVersionLoading } from '../../store/appStore'
import { isTextOnlyVersion, versionHasVisualization } from '../../utils/canvas'
import { BookmarkButton } from '../shared/BookmarkButton'
import { RefinementChips } from '../shared/RefinementChips'
import { ChatWorkingIndicator } from './ChatWorkingIndicator'
import { NarrativeText } from './NarrativeText'

interface Props {
  version: Version
  versionNumber: number
  isActive: boolean
}

export function ChatMessage({ version, versionNumber, isActive }: Props) {
  const setActiveVersion = useAppStore((s) => s.setActiveVersion)
  const openBookmarkPrompt = useAppStore((s) => s.openBookmarkPrompt)
  const removeBookmark = useAppStore((s) => s.removeBookmark)
  const submitQuestion = useAppStore((s) => s.submitQuestion)
  const openCanvas = useAppStore((s) => s.openCanvas)
  const canvasOpen = useAppStore((s) => s.canvasOpen)
  const simulationPhase = useAppStore((s) => s.simulationPhase)
  const isLoading = useIsVersionLoading(version.id)
  const showWorkingOrb =
    isLoading &&
    simulationPhase !== 'triage-prompt' &&
    simulationPhase !== 'idle'

  const summary = version.summary ?? 'Report generated from your question'
  const isTextOnly = isTextOnlyVersion(version)
  const hasVisualization = versionHasVisualization(version)
  const showVisualizationCard =
    !isLoading && hasVisualization && simulationPhase === 'complete'

  return (
    <div className={`space-y-4 ${!isActive ? 'opacity-80' : ''}`}>
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-surface px-4 py-3 text-sm leading-relaxed text-body">
          {version.question}
        </div>
      </div>

      <div className="space-y-3">
        {showWorkingOrb && <ChatWorkingIndicator />}

        {!isLoading && (
          <>
            <div className="max-w-[90%] space-y-2">
              {isTextOnly ? (
                <div className="text-left">
                  <NarrativeText segments={version.narrative} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveVersion(version.id)}
                  className="text-left"
                >
                  <p className="text-sm leading-relaxed text-body">{summary}</p>
                  {version.report.originalReportRef && (
                    <p className="mt-2 text-xs text-border-form">
                      From report by {version.report.originalReportRef.createdBy} ·{' '}
                      {new Date(version.report.originalReportRef.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </button>
              )}

              {showVisualizationCard && (
                <div
                  className={`relative w-full max-w-sm overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${
                    isActive && canvasOpen
                      ? 'border-2 border-brand ring-2 ring-brand/15 shadow-[0_2px_12px_rgba(0,38,119,0.12)]'
                      : 'border-border hover:border-brand/25 hover:shadow-md'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveVersion(version.id)
                      openCanvas()
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 pr-11 text-left transition-colors hover:bg-highlight/20"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-brand">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-brand">
                        {version.report.triageLane === 'export' ? 'Export ready' : 'View dashboard'}
                      </p>
                      <span className="mt-1.5 inline-block rounded-md bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-border-form">
                        v{versionNumber}
                      </span>
                    </div>
                  </button>

                  <div className="absolute right-2 top-2.5">
                    <BookmarkButton
                      bookmarked={version.favorited}
                      onClick={() =>
                        version.favorited
                          ? removeBookmark(version.id)
                          : openBookmarkPrompt(version.id)
                      }
                      size="sm"
                    />
                  </div>
                </div>
              )}

              {!showVisualizationCard && !isTextOnly && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-border-form">
                    v{versionNumber}
                  </span>
                  <BookmarkButton
                    bookmarked={version.favorited}
                    onClick={() =>
                      version.favorited ? removeBookmark(version.id) : openBookmarkPrompt(version.id)
                    }
                    size="sm"
                  />
                </div>
              )}

              <RefinementChips chips={version.refinementChips} onSelect={submitQuestion} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
