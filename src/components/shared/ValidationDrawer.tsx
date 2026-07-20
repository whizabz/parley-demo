import { useState } from 'react'
import { Maximize2, X } from 'lucide-react'
import { useAppStore, useActiveVersion } from '../../store/appStore'
import { dataSources } from '../../data/domains'
import { buildLineageGraph } from '../../data/lineageGraph'
import { ExpandModal } from './ExpandModal'
import { LineageCanvas } from './LineageCanvas'
import { SqlCodeBlock } from './SqlCodeBlock'
import type { Card } from '../../types'

function getReportQuery(cards: Card[]): string {
  const sqlQueries = cards
    .map((card) => card.queryLogic?.trim())
    .filter((query) => query && !query.startsWith('--'))

  if (sqlQueries.length === 0) {
    return cards[0]?.queryLogic ?? 'No query available'
  }

  return sqlQueries.reduce((longest, query) => (query.length > longest.length ? query : longest))
}

function SectionHeader({
  title,
  onExpand,
}: {
  title: string
  onExpand: () => void
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-brand">{title}</h3>
      <button
        type="button"
        onClick={onExpand}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-border-form hover:bg-white hover:text-brand"
        aria-label={`Expand ${title.toLowerCase()}`}
      >
        <Maximize2 className="h-3.5 w-3.5" />
        Expand
      </button>
    </div>
  )
}

export function ValidationDrawer() {
  const open = useAppStore((s) => s.validationOpen)
  const close = useAppStore((s) => s.closeValidation)
  const version = useActiveVersion()
  const [expandedView, setExpandedView] = useState<'sql' | 'lineage' | null>(null)

  if (!open || !version) return null

  const sources = version.report.cards.flatMap((c) => c.sources)
  const uniqueSources = [...new Set(sources)]
  const sql = getReportQuery(version.report.cards)
  const lineageGraph = buildLineageGraph(uniqueSources)

  return (
    <>
      <ExpandModal
        open={expandedView === 'sql'}
        title="Logic"
        onClose={() => setExpandedView(null)}
      >
        <SqlCodeBlock sql={sql} className="max-h-none border-0 p-0" />
      </ExpandModal>

      <ExpandModal
        open={expandedView === 'lineage'}
        title="Lineage"
        onClose={() => setExpandedView(null)}
      >
        <LineageCanvas graph={lineageGraph} viewportHeight={480} className="border-0" />
      </ExpandModal>

      <div className="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          className="absolute inset-0 bg-black/30"
          onClick={close}
          aria-label="Close validation panel"
        />
        <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-serif text-2xl text-brand">Report Validation</h2>
            <button type="button" onClick={close} className="rounded p-1 hover:bg-surface">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <section className="rounded bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">Sources</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between text-xs font-semibold uppercase tracking-wide text-border-form">
                  <span>Source</span>
                  <span>Last updated</span>
                </li>
                {uniqueSources.map((name) => {
                  const ds = dataSources.find((d) => d.name === name)
                  return (
                    <li key={name} className="flex justify-between">
                      <span>{name}</span>
                      <span className="text-border-form">
                        {ds
                          ? new Date(ds.lastRefreshed).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : 'Unknown'}
                      </span>
                    </li>
                  )
                })}
                <li className="flex justify-between text-impact">
                  <span>Risk Adjustment Model</span>
                  <span className="text-xs">Restricted — no access</span>
                </li>
              </ul>
            </section>

            <section className="rounded bg-surface p-4">
              <SectionHeader title="Logic" onExpand={() => setExpandedView('sql')} />
              <SqlCodeBlock sql={sql} className="max-h-40" />
            </section>

            <section className="rounded bg-surface p-4">
              <SectionHeader title="Lineage" onExpand={() => setExpandedView('lineage')} />
              <LineageCanvas graph={lineageGraph} />
            </section>
          </div>
        </aside>
      </div>
    </>
  )
}
