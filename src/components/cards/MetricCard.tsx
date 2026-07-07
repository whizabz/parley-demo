import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { MetricCard as MetricCardType } from '../../types'

interface Props {
  card: MetricCardType
}

export function MetricCard({ card }: Props) {
  const Icon =
    card.changeDirection === 'up'
      ? TrendingUp
      : card.changeDirection === 'down'
        ? TrendingDown
        : Minus

  return (
    <div className="@container min-w-0">
      <h3 className="mb-2 text-sm font-medium text-border-form">{card.title}</h3>
      <p className="break-words text-[clamp(1.125rem,15cqi,3rem)] font-semibold leading-tight text-brand">
        {card.value}
      </p>
      {card.subtitle && <p className="mt-1 text-sm text-border-form">{card.subtitle}</p>}
      {card.change && (
        <p className="mt-2 flex items-center gap-1 text-sm text-body">
          <Icon className="h-4 w-4" />
          {card.change}
        </p>
      )}
    </div>
  )
}
