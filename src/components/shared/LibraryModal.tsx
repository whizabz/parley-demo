import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, FileSpreadsheet, LayoutDashboard, Search, X } from 'lucide-react'
import { useAppStore, useFavoritedVersions } from '../../store/appStore'
import {
  getArtifactDisplayName,
  getArtifactKind,
  getArtifactTypeLabel,
  type ArtifactKind,
} from '../../utils/artifacts'
import { ArtifactMenu } from './ArtifactMenu'

type TypeFilter = 'all' | ArtifactKind
type SortKey = 'newest' | 'oldest' | 'name'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function SelectField({
  value,
  onChange,
  'aria-label': ariaLabel,
  children,
}: {
  value: string
  onChange: (value: string) => void
  'aria-label': string
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="h-10 appearance-none rounded-xl border border-border bg-white py-0 pl-3 pr-8 text-sm text-body outline-none focus:border-brand/30"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-border-form"
        aria-hidden
      />
    </div>
  )
}

export function LibraryModal() {
  const open = useAppStore((s) => s.libraryOpen)
  const closeLibrary = useAppStore((s) => s.closeLibrary)
  const loadSaved = useAppStore((s) => s.loadSavedReport)
  const favorited = useFavoritedVersions()

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLibrary()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, closeLibrary])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setTypeFilter('all')
      setSortKey('newest')
    }
  }, [open])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    let next = [...favorited]

    if (typeFilter !== 'all') {
      next = next.filter((v) => getArtifactKind(v) === typeFilter)
    }
    if (q) {
      next = next.filter((v) => {
        const name = getArtifactDisplayName(v).toLowerCase()
        const file = v.report.exportFileName?.toLowerCase() ?? ''
        return name.includes(q) || file.includes(q) || v.question.toLowerCase().includes(q)
      })
    }

    next.sort((a, b) => {
      if (sortKey === 'name') {
        return getArtifactDisplayName(a).localeCompare(getArtifactDisplayName(b))
      }
      const delta = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortKey === 'oldest' ? delta : -delta
    })

    return next
  }, [favorited, query, typeFilter, sortKey])

  if (!open) return null

  const openItem = (id: string) => {
    closeLibrary()
    loadSaved(id)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        onClick={closeLibrary}
        aria-label="Close library"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-modal-title"
        className="relative flex max-h-[min(520px,calc(100vh-6rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 pt-5 pb-1">
          <div>
            <h2 id="library-modal-title" className="font-serif text-2xl text-brand">
              Artifacts
            </h2>
            <p className="mt-0.5 text-sm text-border-form">
              {favorited.length === 0
                ? 'Reports and exports you’ve kept for later.'
                : `${items.length} of ${favorited.length} artifacts`}
            </p>
          </div>
          <button
            type="button"
            onClick={closeLibrary}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-border-form hover:bg-surface hover:text-brand"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 px-5 pb-3 pt-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-border-form" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search artifacts…"
              className="h-10 w-full rounded-xl border border-border bg-surface/60 py-0 pl-9 pr-3 text-sm text-body outline-none placeholder:text-border-form focus:border-brand/30 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SelectField
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as TypeFilter)}
              aria-label="Filter by type"
            >
              <option value="all">All types</option>
              <option value="dashboard">Dashboards</option>
              <option value="export">CSVs</option>
            </SelectField>

            <SelectField
              value={sortKey}
              onChange={(v) => setSortKey(v as SortKey)}
              aria-label="Sort"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name</option>
            </SelectField>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {favorited.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center px-4 text-center">
              <p className="text-sm font-medium text-brand">No artifacts yet</p>
              <p className="mt-1 max-w-sm text-sm text-border-form">
                Save a dashboard or CSV from a response to keep it here.
              </p>
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-border-form">No matching items</p>
          ) : (
            <ul className="space-y-0.5">
              {items.map((v) => {
                const kind = getArtifactKind(v)
                const displayName = getArtifactDisplayName(v)
                const Icon = kind === 'export' ? FileSpreadsheet : LayoutDashboard
                return (
                  <li
                    key={v.id}
                    className="group relative flex items-center gap-2 rounded-lg py-1.5 pl-2 pr-9 hover:bg-surface"
                  >
                    <button
                      type="button"
                      onClick={() => openItem(v.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-brand group-hover:bg-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-brand">
                          {displayName}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-border-form">
                          <span>{getArtifactTypeLabel(kind)}</span>
                          <span aria-hidden>·</span>
                          <span>{formatDate(v.createdAt)}</span>
                        </span>
                      </span>
                    </button>
                    <ArtifactMenu version={v} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
