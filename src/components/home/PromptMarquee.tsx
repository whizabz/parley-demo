import type { SuggestedPrompt } from '../../types'
import { marqueeRowOne, marqueeRowTwo } from '../../data/suggestedPrompts'

interface PromptMarqueeProps {
  onSelect: (question: string) => void
}

const MARQUEE_COPIES = 3

function MarqueeRow({
  prompts,
  direction,
  onSelect,
}: {
  prompts: SuggestedPrompt[]
  direction: 'left' | 'right'
  onSelect: (question: string) => void
}) {
  const track = Array.from({ length: MARQUEE_COPIES }, () => prompts).flat()

  return (
    <div className="relative overflow-hidden py-2">
      <div
        className={`flex w-max gap-3 ${direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}`}
      >
        {track.map((prompt, i) => (
          <button
            key={`${prompt.id}-${i}`}
            type="button"
            onClick={() => onSelect(prompt.question)}
            className="shrink-0 rounded-full border border-border-form bg-white px-4 py-2 text-sm text-brand shadow-sm transition-colors hover:border-brand hover:bg-highlight"
          >
            {prompt.title}
          </button>
        ))}
      </div>
    </div>
  )
}

export function PromptMarquee({ onSelect }: PromptMarqueeProps) {
  return (
    <div className="space-y-1">
      <MarqueeRow prompts={marqueeRowOne} direction="left" onSelect={onSelect} />
      <MarqueeRow prompts={marqueeRowTwo} direction="right" onSelect={onSelect} />
    </div>
  )
}
