import { useAppStore, useActiveVersion, useIsLatestVersion } from '../../store/appStore'
import { BookmarkButton } from '../shared/BookmarkButton'
import { TextLink } from '../shared/TextLink'

export function VersionBanner() {
  const version = useActiveVersion()
  const isLatest = useIsLatestVersion()
  const goToLatest = useAppStore((s) => s.goToLatest)
  const openBookmarkPrompt = useAppStore((s) => s.openBookmarkPrompt)
  const removeBookmark = useAppStore((s) => s.removeBookmark)

  if (!version || isLatest) return null

  return (
    <div className="flex items-center justify-between border-b border-border bg-highlight px-4 py-3">
      <div className="flex items-center gap-3">
        <p className="text-sm text-body">
          Viewing: <span className="font-medium text-brand">{version.question}</span>
        </p>
        <BookmarkButton
          bookmarked={version.favorited}
          onClick={() =>
            version.favorited ? removeBookmark(version.id) : openBookmarkPrompt(version.id)
          }
          size="sm"
        />
      </div>
      <TextLink onClick={goToLatest}>Back to latest</TextLink>
    </div>
  )
}
