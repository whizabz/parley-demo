import type { InsightCard as InsightCardType } from '../../types'

interface Props {
  card: InsightCardType
}

export function InsightCard({ card }: Props) {
  return (
    <div>
      <h3 className="mb-3 font-serif text-base font-semibold text-brand">{card.title}</h3>
      <p className="font-serif text-sm leading-relaxed text-body">{card.body}</p>
    </div>
  )
}
