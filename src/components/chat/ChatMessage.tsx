import { BarChart3, FileSpreadsheet, CircleAlert } from 'lucide-react'
import type { Version } from '../../types'
import { useAppStore, useIsVersionLoading } from '../../store/appStore'
import { isTextOnlyVersion, versionHasVisualization } from '../../utils/canvas'
import {
  getArtifactDisplayName,
  getArtifactKind,
  getArtifactTypeLabel,
} from '../../utils/artifacts'
import { BookmarkButton } from '../shared/BookmarkButton'
import { ChatWorkingIndicator } from './ChatWorkingIndicator'
import { ClarificationPrompt } from './ClarificationPrompt'
import { FailurePrompt } from './FailurePrompt'
import { MessageFeedback } from './MessageFeedback'
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
  const openCanvas = useAppStore((s) => s.openCanvas)
  const canvasOpen = useAppStore((s) => s.canvasOpen)
  const simulationPhase = useAppStore((s) => s.simulationPhase)
  const versions = useAppStore((s) => s.versions)
  const isLoading = useIsVersionLoading(version.id)
  const showWorkingOrb =
    isLoading &&
    simulationPhase !== 'triage-prompt' &&
    simulationPhase !== 'idle'

  const summary = version.summary ?? 'Report generated from your question'
  const isClarify = version.responseKind === 'clarify'
  const isFailure = version.responseKind === 'failure' || version.failureKind === 'partial'
  const isTextOnly = isTextOnlyVersion(version)
  const hasVisualization = versionHasVisualization(version)
  // Keep prior turns' artifact cards visible while a newer turn is thinking.
  // Only the in-flight version (isLoading) should hide its card.
  const showVisualizationCard = !isLoading && hasVisualization
  const artifactKind = getArtifactKind(version)
  const isExport = artifactKind === 'export'
  const ArtifactIcon = isExport ? FileSpreadsheet : BarChart3
  const isLatestVersion = versions[versions.length - 1]?.id === version.id
  // Per-version readiness only — don't require this turn to be "active".
  // Clicking an older artifact while a request is thinking would otherwise
  // leave the failure CTA disabled after the answer lands.
  const failureInteractive =
    isFailure &&
    !isLoading &&
    (simulationPhase === 'complete' || simulationPhase === 'idle') &&
    (isLatestVersion || version.accessRequestStatus === 'granted')
  const clarificationInteractive =
    isClarify &&
    isLatestVersion &&
    isActive &&
    !isLoading &&
    simulationPhase === 'complete' &&
    !version.selectedClarificationId

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
                  {version.responseKind === 'failure' &&
                    version.failureKind === 'system' && (
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-error">
                        <CircleAlert className="h-3.5 w-3.5 shrink-0" />
                        Request failed
                      </p>
                    )}
                  {version.responseKind === 'failure' &&
                    version.failureKind === 'access-denied' && (
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-error">
                        <CircleAlert className="h-3.5 w-3.5 shrink-0" />
                        Access restricted
                      </p>
                    )}
                  <NarrativeText segments={version.narrative} />
                  {isClarify && (
                    <ClarificationPrompt
                      version={version}
                      interactive={clarificationInteractive}
                    />
                  )}
                  {version.responseKind === 'failure' && (
                    <FailurePrompt version={version} interactive={failureInteractive} />
                  )}
                </div>
              ) : (
                <div className="text-left">
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
                  {version.failureKind === 'partial' && (
                    <FailurePrompt version={version} interactive={failureInteractive} />
                  )}
                </div>
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
                      <ArtifactIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-snug text-brand">
                        {getArtifactDisplayName(version)}
                      </p>
                      <span className="mt-1.5 inline-block rounded-md bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-border-form">
                        {getArtifactTypeLabel(artifactKind)} · v{versionNumber}
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
                      label={
                        version.favorited
                          ? 'Remove from library'
                          : isExport
                            ? 'Save export'
                            : 'Save report'
                      }
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
                    label={version.favorited ? 'Remove from library' : 'Save report'}
                  />
                </div>
              )}

              {!isClarify && version.responseKind !== 'failure' && (
                <MessageFeedback version={version} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
