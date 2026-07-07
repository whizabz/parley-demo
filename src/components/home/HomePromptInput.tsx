import { useState } from 'react'
import { ArrowUp, Mic } from 'lucide-react'
import { useSpeechDictation } from '../../hooks/useSpeechDictation'
import { useAppStore } from '../../store/appStore'

interface HomePromptInputProps {
  onSubmit: (question: string) => void
}

export function HomePromptInput({ onSubmit }: HomePromptInputProps) {
  const [input, setInput] = useState('')
  const addToast = useAppStore((s) => s.addToast)
  const { listening, supported, toggleListening } = useSpeechDictation((text) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text))
  })

  const handleSubmit = () => {
    const q = input.trim()
    if (!q) return
    onSubmit(q)
    setInput('')
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          rows={4}
          placeholder="Ask a question about your data…"
          className="w-full resize-none bg-transparent text-base leading-relaxed text-body outline-none placeholder:text-border-form"
        />
        <div className="mt-0.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (!supported) {
                addToast('Voice dictation is not supported in this browser.')
                return
              }
              toggleListening()
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
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
            disabled={!input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            aria-label="Submit question"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
