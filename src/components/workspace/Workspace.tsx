import { useEffect } from 'react'
import { ChatPanel } from '../chat/ChatPanel'
import { CanvasPanel } from '../canvas/CanvasPanel'
import { useReportSimulation } from '../../hooks/useReportSimulation'
import { useAppStore, useActiveVersion } from '../../store/appStore'
import { shouldAutoOpenCanvas, shouldShowCanvasContent } from '../../utils/canvas'

const CANVAS_SHADOW =
  'shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)]'

const WORKSPACE_TRANSITION = 'duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]'

function ResizeDivider() {
  return (
    <div className="group relative z-10 flex w-3 shrink-0 items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-1 rounded-full px-1 py-3">
        <span className="h-1 w-1 rounded-full bg-border-form/35" />
        <span className="h-1 w-1 rounded-full bg-border-form/35" />
        <span className="h-1 w-1 rounded-full bg-border-form/35" />
      </div>
    </div>
  )
}

export function Workspace() {
  useReportSimulation()

  const canvasOpen = useAppStore((s) => s.canvasOpen)
  const openCanvas = useAppStore((s) => s.openCanvas)
  const closeCanvas = useAppStore((s) => s.closeCanvas)
  const simulationPhase = useAppStore((s) => s.simulationPhase)
  const version = useActiveVersion()

  const canvasHasContent = shouldShowCanvasContent(simulationPhase, version)
  const canvasExpanded = canvasOpen && canvasHasContent

  useEffect(() => {
    if (shouldAutoOpenCanvas(simulationPhase, version)) {
      openCanvas()
    }
  }, [simulationPhase, version?.id, openCanvas])

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-white">
      <div
        className={`flex h-full min-w-0 justify-center overflow-hidden transition-[width] ${WORKSPACE_TRANSITION} ${
          canvasExpanded ? 'w-1/2' : 'w-full'
        }`}
      >
        <div
          className={`flex h-full w-full flex-col transition-[max-width,transform] ${WORKSPACE_TRANSITION} ${
            canvasExpanded ? 'max-w-2xl translate-x-0' : 'max-w-3xl translate-x-0'
          }`}
        >
          <ChatPanel />
        </div>
      </div>

      {canvasHasContent && (
        <>
          <div
            className={`shrink-0 overflow-hidden transition-[width,opacity] ${WORKSPACE_TRANSITION} ${
              canvasExpanded ? 'w-3 opacity-100' : 'w-0 opacity-0'
            }`}
            aria-hidden={!canvasExpanded}
          >
            <ResizeDivider />
          </div>

          <div
            className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden transition-[width,opacity] ${WORKSPACE_TRANSITION} ${
              canvasExpanded
                ? 'w-1/2 opacity-100'
                : 'pointer-events-none w-0 opacity-0'
            }`}
            aria-hidden={!canvasExpanded}
          >
            <div
              className={`flex h-full min-h-0 flex-col px-3 pb-3 pt-2 transition-transform ${WORKSPACE_TRANSITION} ${
                canvasExpanded ? 'translate-x-0' : 'translate-x-6'
              }`}
            >
              <div
                className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface ${CANVAS_SHADOW}`}
              >
                <CanvasPanel onClose={closeCanvas} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
