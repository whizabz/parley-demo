import { useAppStore } from '../../store/appStore'
import { RefinementChips } from '../shared/RefinementChips'

export function ContextualSuggestion() {
  const chips = useAppStore((s) => s.contextualFollowUpChips)
  const submitQuestion = useAppStore((s) => s.submitQuestion)

  if (!chips || chips.length === 0) return null

  return (
    <div className="mx-4 mt-4 mb-0 rounded border border-dashed border-accent/40 bg-highlight px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
        Suggested follow-up
      </p>
      <RefinementChips chips={chips} onSelect={submitQuestion} />
    </div>
  )
}
