import { useCallback, useEffect, useRef } from 'react'
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelGroupHandle,
} from 'react-resizable-panels'
import { ChatPanel } from '../chat/ChatPanel'
import { CanvasPanel } from '../canvas/CanvasPanel'
import { useAppStore, useActiveVersion } from '../../store/appStore'
import { shouldAutoOpenCanvas, shouldShowCanvasContent } from '../../utils/canvas'

const CANVAS_SHADOW =
  'shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)]'

/** Chat panel width (%). Canvas takes the remainder. */
const SNAP_CHAT_SIZES = [30, 50] as const
const SNAP_THRESHOLD = 3.5

function snapChatSize(size: number): number {
  let nearest = size
  let bestDistance = SNAP_THRESHOLD
  for (const snap of SNAP_CHAT_SIZES) {
    const distance = Math.abs(size - snap)
    if (distance <= bestDistance) {
      bestDistance = distance
      nearest = snap
    }
  }
  return nearest
}

function ResizeDivider({ onDragging }: { onDragging: (dragging: boolean) => void }) {
  return (
    <PanelResizeHandle
      hitAreaMargins={{ coarse: 16, fine: 8 }}
      onDragging={onDragging}
      className="group relative z-10 w-px shrink-0 cursor-col-resize bg-border/40 transition-colors hover:bg-brand/35"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
        <span className="h-0.5 w-0.5 rounded-full bg-border-form/50" />
        <span className="h-0.5 w-0.5 rounded-full bg-border-form/50" />
        <span className="h-0.5 w-0.5 rounded-full bg-border-form/50" />
      </div>
    </PanelResizeHandle>
  )
}

export function Workspace() {
  const canvasOpen = useAppStore((s) => s.canvasOpen)
  const openCanvas = useAppStore((s) => s.openCanvas)
  const closeCanvas = useAppStore((s) => s.closeCanvas)
  const simulationPhase = useAppStore((s) => s.simulationPhase)
  const activeConversationId = useAppStore((s) => s.activeConversationId)
  const loadingConversationId = useAppStore((s) => s.loadingConversationId)
  const version = useActiveVersion()
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null)
  const isDraggingRef = useRef(false)
  const isSnappingRef = useRef(false)

  const canvasHasContent = shouldShowCanvasContent(simulationPhase, version)
  const canvasExpanded = canvasOpen && canvasHasContent
  const viewingActiveJob =
    !!loadingConversationId && loadingConversationId === activeConversationId

  useEffect(() => {
    if (!viewingActiveJob) return
    if (shouldAutoOpenCanvas(simulationPhase, version)) {
      openCanvas()
    }
  }, [simulationPhase, version?.id, openCanvas, viewingActiveJob])

  const applySnap = useCallback((layout: number[]) => {
    const chatSize = layout[0]
    if (chatSize == null) return
    const snapped = snapChatSize(chatSize)
    if (Math.abs(snapped - chatSize) < 0.05) return
    isSnappingRef.current = true
    panelGroupRef.current?.setLayout([snapped, 100 - snapped])
    queueMicrotask(() => {
      isSnappingRef.current = false
    })
  }, [])

  const onLayout = useCallback(
    (layout: number[]) => {
      if (!isDraggingRef.current || isSnappingRef.current) return
      applySnap(layout)
    },
    [applySnap],
  )

  const onDragging = useCallback(
    (dragging: boolean) => {
      isDraggingRef.current = dragging
      if (dragging) return
      const layout = panelGroupRef.current?.getLayout()
      if (layout) applySnap(layout)
    },
    [applySnap],
  )

  if (!canvasExpanded) {
    return (
      <div className="flex h-full min-h-0 flex-1 justify-center overflow-hidden bg-white">
        <div className="flex h-full w-full max-w-3xl flex-col">
          <ChatPanel />
        </div>
      </div>
    )
  }

  return (
    <PanelGroup
      ref={panelGroupRef}
      direction="horizontal"
      autoSaveId="parley-workspace-split"
      className="flex h-full min-h-0 flex-1 overflow-hidden bg-white"
      onLayout={onLayout}
    >
      <Panel defaultSize={50} minSize={30} className="min-w-0">
        <div className="flex h-full min-w-0 justify-center overflow-hidden">
          <div className="flex h-full w-full max-w-2xl flex-col">
            <ChatPanel />
          </div>
        </div>
      </Panel>

      <ResizeDivider onDragging={onDragging} />

      <Panel defaultSize={50} minSize={30} className="min-w-0">
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden px-3 pb-3 pt-2">
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface ${CANVAS_SHADOW}`}
          >
            <CanvasPanel onClose={closeCanvas} />
          </div>
        </div>
      </Panel>
    </PanelGroup>
  )
}
