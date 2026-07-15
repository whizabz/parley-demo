import { useAppStore, useActiveVersion } from '../../store/appStore'

export function CanvasObjectSelection() {
  const version = useActiveVersion()
  const selectedCardId = useAppStore((s) => s.selectedCardId)
  const clearCardSelection = useAppStore((s) => s.clearCardSelection)

  if (!version || version.report.cards.length === 0) return null

  const selectedCard = version.report.cards.find((c) => c.id === selectedCardId)

  return (
    <div className="shrink-0 bg-white/80 px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] backdrop-blur-sm">
      {selectedCard ? (
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-accent">
            {selectedCard.title}
          </p>
          <button
            type="button"
            onClick={clearCardSelection}
            className="shrink-0 text-xs text-border-form transition-colors hover:text-body"
          >
            Clear
          </button>
        </div>
      ) : (
        <p className="text-xs text-border-form">Select a chart to explore follow-up questions</p>
      )}
    </div>
  )
}
