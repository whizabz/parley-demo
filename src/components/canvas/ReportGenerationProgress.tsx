import type { PipelineStep } from '../../types'
import { GenerationPanel } from './GenerationPanel'
import { StepList } from './StepList'

interface Props {
  allSteps: PipelineStep[]
  completedCount: number
}

export function ReportGenerationProgress({ allSteps, completedCount }: Props) {
  return (
    <GenerationPanel title="Working on your report">
      <StepList steps={allSteps} completedCount={completedCount} />
    </GenerationPanel>
  )
}
