import { RefreshCw, ShieldAlert, Clock, ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import type { FailureActionId, Version } from '../../types'
import { useAppStore } from '../../store/appStore'

interface FailurePromptProps {
  version: Version
  interactive: boolean
}

function ActionButton({
  label,
  description,
  icon,
  primary,
  disabled,
  onClick,
}: {
  label: string
  description?: string
  icon: ReactNode
  primary?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:cursor-default ${
        primary
          ? 'border-brand/40 bg-highlight/30 hover:bg-highlight/45'
          : 'border-border bg-white hover:border-brand/30 hover:bg-surface/60'
      } disabled:opacity-50`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface text-brand">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-body">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-border-form">
            {description}
          </span>
        )}
      </span>
    </button>
  )
}

function StatusNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/80 bg-surface/70 px-3 py-2.5 text-sm text-body">
      {children}
    </div>
  )
}

export function FailurePrompt({ version, interactive }: FailurePromptProps) {
  const resolveFailureAction = useAppStore((s) => s.resolveFailureAction)
  const kind = version.failureKind
  const status = version.accessRequestStatus ?? 'idle'
  const selected = version.selectedFailureActionId
  const owner = version.restrictedSourceOwner ?? 'the owning team'
  const sources = version.restrictedSources?.join(', ') ?? 'restricted sources'
  const narrow = version.narrowQuestion

  if (!kind) return null

  const run = (action: FailureActionId) => {
    if (!interactive) return
    resolveFailureAction(version.id, action)
  }

  if (kind === 'system') {
    const retried = selected === 'retry'
    return (
      <div className="mt-3">
        {retried ? (
          <StatusNote>Retry started from this turn.</StatusNote>
        ) : (
          <button
            type="button"
            disabled={!interactive}
            onClick={() => run('retry')}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-default disabled:opacity-40"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        )}
      </div>
    )
  }

  if (kind === 'partial') {
    if (status === 'pending') {
      return (
        <div className="mt-3">
          <StatusNote>
            Access request sent to {owner}. You’ll be notified here when it’s approved.
          </StatusNote>
        </div>
      )
    }
    if (status === 'granted') {
      return (
        <div className="mt-3 space-y-2">
          <StatusNote>
            Access approved for {sources}. You can re-run for the complete picture.
          </StatusNote>
          {interactive && (
            <ActionButton
              primary
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              label="Run again with full access"
              onClick={() => run('run-again')}
            />
          )}
        </div>
      )
    }
    if (selected === 'request-full-access') return null
    return (
      <div className="mt-3 space-y-2">
        <ActionButton
          disabled={!interactive}
          icon={<ShieldAlert className="h-3.5 w-3.5" />}
          label="Request access to complete the picture"
          description={`Ask ${owner} for access to ${sources}.`}
          onClick={() => run('request-full-access')}
        />
      </div>
    )
  }

  // access-denied
  if (status === 'pending') {
    return (
      <div className="mt-3">
        <StatusNote>
          Access request sent to {owner}. This turn stays here — come back anytime; we’ll
          update it when access lands.
        </StatusNote>
      </div>
    )
  }

  if (status === 'one-off-pending') {
    return (
      <div className="mt-3">
        <StatusNote>
          One-off request submitted. Preparing a single answer without changing your standing
          permissions…
        </StatusNote>
      </div>
    )
  }

  if (status === 'granted') {
    return (
      <div className="mt-3 space-y-2">
        <StatusNote>
          Access approved for {sources}. Want me to run this again?
        </StatusNote>
        {interactive && selected !== 'run-again' && (
          <ActionButton
            primary
            icon={<ArrowRight className="h-3.5 w-3.5" />}
            label="Run again"
            onClick={() => run('run-again')}
          />
        )}
        {selected === 'run-again' && <StatusNote>Running with your new access…</StatusNote>}
      </div>
    )
  }

  if (status === 'one-off-delivered' || selected === 'narrow' || selected === 'one-off') {
    return (
      <div className="mt-3">
        <StatusNote>
          {selected === 'narrow'
            ? 'Following up with a narrower question that stays within your access.'
            : 'One-off path started from this turn. Standing permissions were not changed.'}
        </StatusNote>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <ActionButton
        primary
        disabled={!interactive}
        icon={<ShieldAlert className="h-3.5 w-3.5" />}
        label="Request access"
        description={`Send a standing access request to ${owner} for ${sources}.`}
        onClick={() => run('request-access')}
      />
      <ActionButton
        disabled={!interactive}
        icon={<Clock className="h-3.5 w-3.5" />}
        label="Request a one-off answer"
        description="Get this answered once without changing your standing permissions."
        onClick={() => run('one-off')}
      />
      {narrow && (
        <ActionButton
          disabled={!interactive}
          icon={<ArrowRight className="h-3.5 w-3.5" />}
          label="Ask a narrower question"
          description={narrow}
          onClick={() => run('narrow')}
        />
      )}
    </div>
  )
}
