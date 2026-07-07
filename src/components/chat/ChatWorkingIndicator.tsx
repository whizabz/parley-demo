import { useMemo } from 'react'
import { getPipelineForOutcome } from '../../data/triageFlow'
import { useAppStore } from '../../store/appStore'
import { AiOrb } from '../shared/AiOrb'

export function ChatWorkingIndicator() {
  const thinkingStep = useAppStore((s) => s.thinkingStep)
  const triageOutcome = useAppStore((s) => s.triageOutcome)

  const pipelineSteps = useMemo(
    () => (triageOutcome ? getPipelineForOutcome(triageOutcome) : []),
    [triageOutcome],
  )

  const stepIndex = Math.min(thinkingStep, Math.max(0, pipelineSteps.length - 1))
  const currentStep = pipelineSteps[stepIndex]

  if (!currentStep) return null

  return (
    <div className="flex max-w-md items-start gap-3">
      <AiOrb size="sm" className="mt-1" />
      <p
        key={currentStep.text}
        className={`animate-card-rise pt-2 text-sm leading-relaxed ${
          currentStep.variant === 'alert' ? 'text-body' : 'text-border-form'
        }`}
      >
        {currentStep.text}
      </p>
    </div>
  )
}
