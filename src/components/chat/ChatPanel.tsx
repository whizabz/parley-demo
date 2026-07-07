import { useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { ChatThread } from './ChatThread'

export function ChatInput() {
  const [input, setInput] = useState('')
  const submitQuestion = useAppStore((s) => s.submitQuestion)
  const simulationPhase = useAppStore((s) => s.simulationPhase)
  const isBusy =
    simulationPhase === 'discovering' ||
    simulationPhase === 'thinking' ||
    simulationPhase === 'background-wait' ||
    simulationPhase === 'revealing'

  const handleSubmit = () => {
    const q = input.trim()
    if (!q || isBusy) return
    submitQuestion(q)
    setInput('')
  }

  return (
    <div className="shrink-0 px-4 pb-6 pt-2 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="rounded-2xl border border-border bg-white p-3 shadow-sm"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question…"
          disabled={isBusy}
          className="w-full bg-transparent px-1 py-1 text-sm text-body outline-none placeholder:text-border-form disabled:opacity-50"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

export function ChatPanel() {
  return (
    <div className="flex h-full flex-col bg-white">
      <ChatThread />
      <ChatInput />
    </div>
  )
}
