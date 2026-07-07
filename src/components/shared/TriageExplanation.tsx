import type { TriageLane } from '../../types'
import { getTriageExplanation } from '../../data/triageLanes'

interface Props {
  triageLane: TriageLane
  className?: string
}

export function TriageExplanation({ triageLane, className = '' }: Props) {
  const explanation = getTriageExplanation(triageLane)
  if (!explanation) return null

  return (
    <p className={`border-l-2 border-accent pl-3 text-sm leading-relaxed text-body ${className}`}>
      {explanation}
    </p>
  )
}
