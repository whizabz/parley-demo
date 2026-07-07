import { Download } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

interface Props {
  fileName: string
  fileSize: string
}

export function ExportResult({ fileName, fileSize }: Props) {
  const addToast = useAppStore((s) => s.addToast)

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
        <button
          type="button"
          onClick={() => addToast('Export started — file will download shortly.')}
          className="rounded bg-brand px-6 py-2.5 text-sm text-white hover:bg-brand/90"
        >
          Download CSV
        </button>
      </div>
    </div>
  )
}
