import { useAppStore, useActiveVersion, useIsActiveVersionLoading } from '../../store/appStore'
import { CardShell } from '../cards/CardShell'

export function CardGrid() {
  const version = useActiveVersion()
  const revealedCardCount = useAppStore((s) => s.revealedCardCount)
  const simulationPhase = useAppStore((s) => s.simulationPhase)
  const selectedCardId = useAppStore((s) => s.selectedCardId)
  const selectCard = useAppStore((s) => s.selectCard)
  const clearCardSelection = useAppStore((s) => s.clearCardSelection)
  const isActiveLoading = useIsActiveVersionLoading()

  if (!version) return null

  const isRevealing = isActiveLoading && simulationPhase === 'revealing'
  const cards = version.report.cards
  const isBackgroundTable =
    version.report.triageLane === 'background' &&
    cards.length === 1 &&
    cards[0]?.type === 'table'

  return (
    <div
      className={
        isBackgroundTable
          ? 'p-6'
          : 'columns-1 gap-4 p-6 sm:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid'
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) clearCardSelection()
      }}
    >
      {cards.map((card, i) => {
        const visible = !isRevealing || i < revealedCardCount
        if (!visible) return null
        const isNew = isRevealing && i === revealedCardCount - 1
        return (
          <div key={card.id} className="break-inside-avoid">
            <CardShell
              card={card}
              selected={selectedCardId === card.id}
              animate={isNew}
              onSelect={() => selectCard(card.id, card.contextualFollowUpChips)}
            />
          </div>
        )
      })}
    </div>
  )
}
