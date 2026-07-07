import type { DemoMode, PipelineStep, Scenario, TriageOutcome } from '../types'
import { applyTriageLaneOverride } from './scenarios'

export const SHARED_PREFIX_STEPS: PipelineStep[] = [
  { text: 'Analyzing your request…' },
  { text: 'Understanding relevant data sources…' },
  { text: 'Looking up semantics…' },
  { text: 'Looking for existing reports…' },
]

const TEXT_PREFIX_STEPS: PipelineStep[] = SHARED_PREFIX_STEPS.slice(0, 3)

export const SHARED_PREFIX_LENGTH = SHARED_PREFIX_STEPS.length

const EXISTING_REPORT_STEP: PipelineStep = { text: 'Existing report found…' }
const NO_EXISTING_REPORT_STEP: PipelineStep = { text: 'No existing report found…' }

export function getPipelineForOutcome(outcome: TriageOutcome): PipelineStep[] {
  switch (outcome) {
    case 'text':
      return TEXT_PREFIX_STEPS
    case 'reuse':
      return [...SHARED_PREFIX_STEPS, EXISTING_REPORT_STEP]
    case 'instant':
      return [
        ...SHARED_PREFIX_STEPS,
        NO_EXISTING_REPORT_STEP,
        { text: 'Building report logic…' },
        { text: 'Generating insights…' },
      ]
    case 'background':
      return [
        ...SHARED_PREFIX_STEPS,
        NO_EXISTING_REPORT_STEP,
        { text: 'Building report logic…' },
        {
          text: "This requires 10K+ records, you'll be notified when the report is ready…",
          variant: 'alert',
        },
        { text: 'Queuing background job…' },
        { text: 'Processing…' },
      ]
    case 'export':
      return [
        ...SHARED_PREFIX_STEPS,
        NO_EXISTING_REPORT_STEP,
        { text: 'Building report logic…' },
        {
          text: "This requires 1M+ records, you'll be notified when the report is ready…",
          variant: 'alert',
        },
        { text: 'Queuing background job…' },
        { text: 'Processing…' },
        { text: 'Preparing export…' },
      ]
  }
}

export const AUTO_TRIAGE_OUTCOME_ORDER = [
  'text',
  'text',
  'reuse',
  'instant',
  'background',
  'export',
] as const satisfies readonly TriageOutcome[]

export function resolveTriageOutcome(
  scenario: Scenario,
  forcedDemoMode: DemoMode | null,
  autoOutcomeIndex = 0,
): TriageOutcome {
  if (forcedDemoMode === 'reused') return 'reuse'
  if (forcedDemoMode === 'background') return 'background'
  if (forcedDemoMode === 'export') return 'export'
  if (forcedDemoMode === 'instant') return 'instant'

  return AUTO_TRIAGE_OUTCOME_ORDER[
    autoOutcomeIndex % AUTO_TRIAGE_OUTCOME_ORDER.length
  ]
}

export function scenarioForOutcome(base: Scenario, outcome: TriageOutcome): Scenario {
  if (outcome === 'text') return { ...base, cards: [] }
  if (outcome === 'export') return applyTriageLaneOverride(base, 'export')
  if (outcome === 'background') return applyTriageLaneOverride(base, 'background')
  return base
}

function isSlowStep(step: PipelineStep): boolean {
  return (
    step.text.startsWith('Queuing') ||
    step.text.startsWith('Processing') ||
    step.text.startsWith('Preparing export')
  )
}

export function getPipelineStepDelay(
  stepIndex: number,
  pipeline: PipelineStep[],
): number {
  const step = pipeline[stepIndex]
  if (!step) return 1800
  return isSlowStep(step) ? 2000 : 1800
}
