import { useState } from 'react'
import type { Version } from '../../types'
import { useAppStore } from '../../store/appStore'

interface ClarificationPromptProps {
  version: Version
  interactive: boolean
}

function OptionLetter({ letter }: { letter: string }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface text-xs font-semibold text-brand">
      {letter}
    </span>
  )
}

export function ClarificationPrompt({ version, interactive }: ClarificationPromptProps) {
  const resolveClarification = useAppStore((s) => s.resolveClarification)
  const options = version.clarificationOptions ?? []
  const submittedId = version.selectedClarificationId

  const [draftId, setDraftId] = useState<string | null>(null)
  const [custom, setCustom] = useState('')

  if (options.length === 0) return null

  const presetOptions = options.filter((o) => !o.allowsCustom)
  const customOption = options.find((o) => o.allowsCustom)
  const activeId = submittedId ?? draftId
  const trimmedCustom = custom.trim()
  const canSubmit =
    interactive &&
    !submittedId &&
    !!activeId &&
    (activeId !== customOption?.id || trimmedCustom.length > 0)

  const handleSubmit = () => {
    if (!canSubmit || !activeId) return
    if (customOption && activeId === customOption.id) {
      resolveClarification(version.id, activeId, trimmedCustom)
      return
    }
    resolveClarification(version.id, activeId)
  }

  return (
    <div className="mt-3 space-y-2">
      {presetOptions.map((option) => {
        const selected = activeId === option.id
        const lockedOut = !!submittedId && !selected

        return (
          <button
            key={option.id}
            type="button"
            disabled={!interactive || !!submittedId}
            onClick={() => setDraftId(option.id)}
            className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
              selected
                ? 'border-brand/40 bg-highlight/30'
                : lockedOut
                  ? 'border-border/60 bg-white opacity-50'
                  : 'border-border bg-white hover:border-brand/30 hover:bg-surface/60'
            } disabled:cursor-default`}
          >
            <OptionLetter letter={option.id} />
            <span className="min-w-0 flex-1 pt-0.5 text-sm text-body">{option.label}</span>
          </button>
        )
      })}

      {customOption && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
            activeId === customOption.id
              ? 'border-brand/40 bg-highlight/30'
              : submittedId
                ? 'border-border/60 bg-white opacity-50'
                : 'border-border bg-white'
          }`}
        >
          <OptionLetter letter={customOption.id} />
          <input
            type="text"
            value={custom}
            disabled={!interactive || !!submittedId}
            onChange={(e) => {
              setCustom(e.target.value)
              setDraftId(customOption.id)
            }}
            onFocus={() => {
              if (interactive && !submittedId) setDraftId(customOption.id)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSubmit) handleSubmit()
            }}
            placeholder="Or type your own…"
            className="min-w-0 flex-1 bg-transparent text-sm text-body outline-none placeholder:text-border-form disabled:cursor-default"
          />
        </div>
      )}

      {interactive && !submittedId && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-40"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}
