import { getReuseTemplate } from '../../data/scenarios'
import { useAppStore } from '../../store/appStore'
import { GenerationPanel } from './GenerationPanel'

export function SimilarReportPrompt() {
  const resolveReuseReport = useAppStore((s) => s.resolveReuseReport)
  const template = getReuseTemplate()
  const ref = template.originalReportRef

  return (
    <GenerationPanel title="Similar report found">
      <p className="text-sm leading-relaxed text-body">
        A similar report already exists. Would you like to use it or generate a new one?
      </p>
      {ref && (
        <p className="mt-2 text-xs text-border-form">
          &ldquo;{ref.question}&rdquo; · by {ref.createdBy} ·{' '}
          {new Date(ref.createdAt).toLocaleDateString()}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => resolveReuseReport('use')}
          className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand/90"
        >
          Use it
        </button>
        <button
          type="button"
          onClick={() => resolveReuseReport('generate-new')}
          className="rounded border border-border px-3 py-1.5 text-sm text-brand hover:bg-highlight"
        >
          Generate new
        </button>
      </div>
    </GenerationPanel>
  )
}
