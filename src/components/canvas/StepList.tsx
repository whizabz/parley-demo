import type { PipelineStep } from '../../types'

interface StepListProps {
  steps: PipelineStep[]
  completedCount: number
}

function bulletClass(done: boolean, current: boolean, variant: PipelineStep['variant']): string {
  if (variant === 'alert') {
    if (done) return 'bg-amber-400'
    if (current) return 'animate-skeleton bg-amber-400'
    return 'bg-border'
  }
  if (done) return 'bg-brand'
  if (current) return 'animate-skeleton bg-accent'
  return 'bg-border'
}

export function StepList({ steps, completedCount }: StepListProps) {
  const visibleCount = Math.min(completedCount + 1, steps.length)
  const visibleSteps = steps.slice(0, visibleCount)

  return (
    <ul className="space-y-3">
      {visibleSteps.map((step, i) => {
        const done = i < completedCount
        const current = i === completedCount
        return (
          <li key={`${i}-${step.text}`} className="flex items-center gap-3 text-sm">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${bulletClass(done, current, step.variant)}`}
            />
            <span className={done || current || step.variant === 'alert' ? 'text-body' : 'text-border-form'}>
              {step.text}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
