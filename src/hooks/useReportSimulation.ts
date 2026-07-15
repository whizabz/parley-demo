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
  const conversations = useAppStore((s) => s.conversations)
  const loadingVersionId = useAppStore((s) => s.loadingVersionId)
  const loadingConversationId = useAppStore((s) => s.loadingConversationId)
  const activeConversationId = useAppStore((s) => s.activeConversationId)
  const view = useAppStore((s) => s.view)

  const setThinkingStep = useAppStore((s) => s.setThinkingStep)
  const setSimulationPhase = useAppStore((s) => s.setSimulationPhase)
  const incrementRevealedCards = useAppStore((s) => s.incrementRevealedCards)
  const completeSimulation = useAppStore((s) => s.completeSimulation)
  const addToast = useAppStore((s) => s.addToast)

  const loadingVersion =
    versions.find((v) => v.id === loadingVersionId) ??
    conversations.flatMap((c) => c.versions).find((v) => v.id === loadingVersionId)

  const totalCards = loadingVersion?.report.cards.length ?? 0
  const isExport = loadingVersion?.report.triageLane === 'export'
  const isAwayFromJob =
    !!loadingConversationId &&
    (view !== 'workspace' || activeConversationId !== loadingConversationId)

  const pipelineSteps = useMemo(
    () => (triageOutcome ? getPipelineForOutcome(triageOutcome) : []),
    [triageOutcome],
  )

  const isProcessing =
    simulationPhase === 'discovering' ||
    simulationPhase === 'thinking' ||
    simulationPhase === 'background-wait'

  useEffect(() => {
    if (!isProcessing || !triageOutcome || !loadingVersionId) return

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
          // Skip card reveal while away so the sidebar can show the ready state.
          if (isAwayFromJob) completeSimulation()
          else setSimulationPhase('revealing')
        }, 6000)
        return () => clearTimeout(timer)
      }
      const timer = setTimeout(() => {
        if (isAwayFromJob) completeSimulation()
        else setSimulationPhase('revealing')
      }, 600)
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
    loadingVersionId,
    isAwayFromJob,
    setThinkingStep,
    setSimulationPhase,
    completeSimulation,
    addToast,
  ])

  useEffect(() => {
    if (simulationPhase !== 'revealing' || !loadingVersionId) return

    // User left mid-reveal: finish immediately so the ready indicator can show.
    if (isAwayFromJob) {
      const timer = setTimeout(() => completeSimulation(), 0)
      return () => clearTimeout(timer)
    }

    if (revealedCardCount < totalCards) {
      const timer = setTimeout(() => incrementRevealedCards(), 700)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => completeSimulation(), 400)
    return () => clearTimeout(timer)
  }, [
    simulationPhase,
    revealedCardCount,
    totalCards,
    loadingVersionId,
    isAwayFromJob,
    incrementRevealedCards,
    completeSimulation,
  ])

  return {
    pipelineSteps,
    completedStepCount: thinkingStep,
    isProcessing,
    isRevealing: simulationPhase === 'revealing',
    isComplete: simulationPhase === 'complete' || simulationPhase === 'idle',
  }
}
