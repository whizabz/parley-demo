import { Bookmark, Download } from 'lucide-react'
import { useAppStore, useActiveVersion } from '../../store/appStore'

interface Props {
  fileName: string
  fileSize: string
}

export function ExportResult({ fileName, fileSize }: Props) {
  const addToast = useAppStore((s) => s.addToast)
  const version = useActiveVersion()
  const openBookmarkPrompt = useAppStore((s) => s.openBookmarkPrompt)
  const removeBookmark = useAppStore((s) => s.removeBookmark)

  return (
    <div className="px-6 pb-6 pt-4">
      <div className="rounded border border-border bg-white p-5 text-center shadow-sm">
        <Download className="mx-auto mb-3 h-8 w-8 text-brand" />
        <h3 className="mb-2 font-serif text-lg text-brand">Export ready</h3>
        <p className="mb-4 text-sm text-body">Your export is ready to download.</p>
        <div className="mb-4 rounded bg-surface px-4 py-3 text-sm">
          <p className="font-medium text-brand">{fileName}</p>
          <p className="text-border-form">{fileSize}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => addToast('Export started — file will download shortly.')}
            className="rounded bg-brand px-6 py-2.5 text-sm text-white hover:bg-brand/90"
          >
            Download CSV
          </button>
          {version && (
            <button
              type="button"
              onClick={() =>
                version.favorited
                  ? removeBookmark(version.id)
                  : openBookmarkPrompt(version.id)
              }
              className="inline-flex items-center gap-2 rounded border border-border px-4 py-2.5 text-sm text-brand hover:bg-surface"
            >
              <Bookmark className={`h-4 w-4 ${version.favorited ? 'fill-brand' : ''}`} />
              {version.favorited ? 'Saved' : 'Save export'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
