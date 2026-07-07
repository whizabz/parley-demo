import type { Card as CardType } from '../../types'
import { Info } from 'lucide-react'
import { ChartCard } from './ChartCard'
import { MetricCard } from './MetricCard'
import { TableCard } from './TableCard'
import { InsightCard } from './InsightCard'

interface CardShellProps {
  card: CardType
  selected?: boolean
  onSelect?: () => void
  animate?: boolean
}

export function CardShell({ card, selected, onSelect, animate }: CardShellProps) {
  const inner = (() => {
    switch (card.type) {
      case 'chart':
        return <ChartCard card={card} />
      case 'metric':
        return <MetricCard card={card} />
      case 'table':
        return <TableCard card={card} />
      case 'insight':
        return <InsightCard card={card} />
    }
  })()

  return (
    <div
      className={`relative rounded border border-border bg-white shadow-sm transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-brand' : ''
      } ${animate ? 'animate-card-rise opacity-0' : ''}`}
      style={animate ? { animationFillMode: 'forwards' } : undefined}
    >
      <div className="group/info absolute right-3 top-3 z-10">
        <Info className="h-4 w-4 text-border-form transition-colors group-hover/info:text-accent" />
        <div
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden w-64 rounded border border-border bg-white p-3 text-xs leading-relaxed text-body shadow-lg group-hover/info:block"
        >
          {card.generationDetail}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.()
        }}
        className="w-full min-w-0 overflow-hidden p-5 pr-10 text-left"
      >
        {inner}
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs text-border-form">Source: {card.sources.join(', ')}</p>
        </div>
      </button>
    </div>
  )
}
