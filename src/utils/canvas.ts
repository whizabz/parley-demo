import type { SimulationPhase, Version } from '../types'

export function versionHasVisualization(version: Version): boolean {
  if (version.responseKind === 'text' || version.responseKind === 'clarify') return false
  if (version.report.triageLane === 'export') return true
  return version.report.cards.length > 0
}

export function isTextOnlyVersion(version: Version): boolean {
  return version.responseKind === 'text' || version.responseKind === 'clarify'
}

export function shouldAutoOpenCanvas(
  simulationPhase: SimulationPhase,
  _version?: Version | null,
): boolean {
  return simulationPhase === 'triage-prompt' || simulationPhase === 'revealing'
}

export function shouldShowCanvasContent(
  simulationPhase: SimulationPhase,
  version?: Version | null,
): boolean {
  if (simulationPhase === 'idle' && !version) return false
  if (!version) return false

  if (
    simulationPhase === 'discovering' ||
    simulationPhase === 'thinking' ||
    simulationPhase === 'background-wait'
  ) {
    return false
  }

  if (simulationPhase === 'triage-prompt') return true

  if (simulationPhase === 'revealing' || simulationPhase === 'complete') {
    return versionHasVisualization(version)
  }

  return false
}
