import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useFavoritedVersions, useAppStore } from '../../store/appStore'
import { getNarrativeSnippet } from '../../utils/narrative'
import { ContentCard } from '../shared/ContentCard'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { BookmarkButton } from '../shared/BookmarkButton'

export function SavedReportsGrid() {
  const favorited = useFavoritedVersions()
  const loadSaved = useAppStore((s) => s.loadSavedReport)
  const removeBookmark = useAppStore((s) => s.removeBookmark)
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)

  if (favorited.length === 0) return null

  return (
    <section className="bg-surface px-6 py-12 md:px-12">
      <ConfirmDialog
        open={pendingRemoveId !== null}
        title="Remove bookmark?"
        message="This report will be removed from your bookmarks. You can always save it again later."
        confirmLabel="Remove"
        onConfirm={() => {
          if (pendingRemoveId) removeBookmark(pendingRemoveId)
          setPendingRemoveId(null)
        }}
        onCancel={() => setPendingRemoveId(null)}
      />
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-6 font-serif text-2xl text-brand">Bookmarked reports</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorited.map((v) => {
            const displayName = v.bookmarkName ?? v.question
            const snippet = getNarrativeSnippet(v.narrative)

            return (
              <ContentCard key={v.id} className="group relative pr-12">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => loadSaved(v.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      loadSaved(v.id)
                    }
                  }}
                  className="cursor-pointer text-left"
                >
                  <h3 className="text-base font-semibold text-brand line-clamp-2">{displayName}</h3>
                  {snippet && (
                    <p className="mt-2 text-sm leading-relaxed text-body line-clamp-2">{snippet}</p>
                  )}
                  <p className="mt-2 text-xs text-border-form">
                    {new Date(v.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="absolute right-5 top-5 bottom-5 z-10 flex w-4 flex-col items-center justify-between">
                  <BookmarkButton
                    bookmarked={v.favorited}
                    onClick={() => setPendingRemoveId(v.id)}
                    size="sm"
                    className="flex h-8 w-8 shrink-0 items-center justify-center p-0 hover:bg-highlight/60"
                  />
                  <ArrowUpRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-border-form transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
                  />
                </div>
              </ContentCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
