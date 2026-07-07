import { useEffect, useMemo } from 'react'
import {
  getPipelineForOutcome,
  getPipelineStepDelay,
  SHARED_PREFIX_LENGTH,
} from '../data/triageFlow'
import { useAppStore } from '../store/appStore'

export function useReportSimulation() {
  const simulationPhase = useAppStore((s) => s.simulationPhase)
  const thinkingStep = useAppStore((s) => s.thinkingStep)
  const triageOutcome = useAppStore((s) => s.triageOutcome)
  const revealedCardCount = useAppStore((s) => s.revealedCardCount)
  const versions = useAppStore((s) => s.versions)
  const activeVersionId = useAppStore((s) => s.activeVersionId)

  const setThinkingStep = useAppStore((s) => s.setThinkingStep)
  const setSimulationPhase = useAppStore((s) => s.setSimulationPhase)
  const incrementRevealedCards = useAppStore((s) => s.incrementRevealedCards)
  const completeSimulation = useAppStore((s) => s.completeSimulation)
  const addToast = useAppStore((s) => s.addToast)

  const activeVersion = versions.find((v) => v.id === activeVersionId)
  const totalCards = activeVersion?.report.cards.length ?? 0
  const isExport = activeVersion?.report.triageLane === 'export'

  const pipelineSteps = useMemo(
    () => (triageOutcome ? getPipelineForOutcome(triageOutcome) : []),
    [triageOutcome],
  )

  const isProcessing =
    simulationPhase === 'discovering' ||
    simulationPhase === 'thinking' ||
    simulationPhase === 'background-wait'

  useEffect(() => {
    if (!isProcessing || !triageOutcome) return

    if (
      simulationPhase === 'discovering' &&
      thinkingStep >= pipelineSteps.length &&
      triageOutcome === 'reuse'
    ) {
      const timer = setTimeout(() => setSimulationPhase('triage-prompt'), 600)
      return () => clearTimeout(timer)
    }

    if (thinkingStep >= pipelineSteps.length) {
      if (triageOutcome === 'text') {
        const timer = setTimeout(() => completeSimulation(), 600)
        return () => clearTimeout(timer)
      }
      if (triageOutcome === 'export' || isExport) {
        const timer = setTimeout(() => completeSimulation(), 800)
        return () => clearTimeout(timer)
      }
      if (triageOutcome === 'background') {
        const timer = setTimeout(() => {
          addToast('Your report is ready.')
          setSimulationPhase('revealing')
        }, 6000)
        return () => clearTimeout(timer)
      }
      const timer = setTimeout(() => setSimulationPhase('revealing'), 600)
      return () => clearTimeout(timer)
    }

    const delay = getPipelineStepDelay(thinkingStep, pipelineSteps)

    const timer = setTimeout(() => {
      const next = thinkingStep + 1
      setThinkingStep(next)

      if (
        next === SHARED_PREFIX_LENGTH &&
        triageOutcome !== 'reuse' &&
        simulationPhase === 'discovering'
      ) {
        setSimulationPhase(triageOutcome === 'background' ? 'background-wait' : 'thinking')
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [
    isProcessing,
    simulationPhase,
    thinkingStep,
    triageOutcome,
    pipelineSteps,
    isExport,
    setThinkingStep,
    setSimulationPhase,
    completeSimulation,
    addToast,
  ])

  useEffect(() => {
    if (simulationPhase !== 'revealing') return
    if (revealedCardCount < totalCards) {
      const timer = setTimeout(() => incrementRevealedCards(), 700)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => completeSimulation(), 400)
    return () => clearTimeout(timer)
  }, [simulationPhase, revealedCardCount, totalCards, incrementRevealedCards, completeSimulation])

  return {
    pipelineSteps,
    completedStepCount: thinkingStep,
    isProcessing,
    isRevealing: simulationPhase === 'revealing',
    isComplete: simulationPhase === 'complete' || simulationPhase === 'idle',
  }
}
