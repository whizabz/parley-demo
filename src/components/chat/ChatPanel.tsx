import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowUp, Mic } from 'lucide-react'
import { useSpeechDictation } from '../../hooks/useSpeechDictation'
import { useAppStore } from '../../store/appStore'
import { RefinementChips } from '../shared/RefinementChips'
import { ChatThread } from './ChatThread'

const MAX_TEXTAREA_PX = 128

export function ChatInput() {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const submitQuestion = useAppStore((s) => s.submitQuestion)
  const composerChips = useAppStore((s) => s.composerChips)
  const addToast = useAppStore((s) => s.addToast)
  const simulationPhase = useAppStore((s) => s.simulationPhase)
  const isBusy =
    simulationPhase === 'discovering' ||
    simulationPhase === 'thinking' ||
    simulationPhase === 'background-wait' ||
    simulationPhase === 'revealing'

  const { listening, supported, toggleListening } = useSpeechDictation((text) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text))
  })

  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`
  }, [input])

  const handleSubmit = () => {
    const q = input.trim()
    if (!q || isBusy) return
    submitQuestion(q)
    setInput('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const showChips = !isBusy && !!composerChips && composerChips.length > 0

  return (
    <div className="mx-auto w-full max-w-2xl shrink-0 px-4 pb-6 pt-2 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
      {showChips && (
        <div className="mb-3">
          <RefinementChips chips={composerChips} onSelect={submitQuestion} />
        </div>
      )}
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-white px-3 py-2 shadow-sm">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ask a follow-up question…"
          disabled={isBusy}
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none bg-transparent py-2 text-base leading-snug text-body outline-none placeholder:text-border-form disabled:opacity-50"
        />
        <div className="mb-0.5 flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              if (!supported) {
                addToast('Voice dictation is not supported in this browser.')
                return
              }
              toggleListening()
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:opacity-40 ${
              listening
                ? 'border-accent bg-highlight text-accent'
                : 'border-border text-border-form hover:bg-surface hover:text-brand'
            }`}
            aria-label={listening ? 'Stop dictation' : 'Start dictation'}
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isBusy || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
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
