import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/appStore'
import { ChatMessage } from './ChatMessage'

export function ChatThread() {
  const versions = useAppStore((s) => s.versions)
  const activeVersionId = useAppStore((s) => s.activeVersionId)
  const simulationPhase = useAppStore((s) => s.simulationPhase)
  const thinkingStep = useAppStore((s) => s.thinkingStep)
  const clearCardSelection = useAppStore((s) => s.clearCardSelection)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [versions.length, activeVersionId, simulationPhase, thinkingStep])

  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) clearCardSelection()
      }}
    >
      <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
        {versions.map((v, i) => (
          <ChatMessage
            key={v.id}
            version={v}
            versionNumber={i + 1}
            isActive={v.id === activeVersionId}
          />
        ))}
        <div ref={bottomRef} aria-hidden className="h-px w-full" />
      </div>
    </div>
  )
}
