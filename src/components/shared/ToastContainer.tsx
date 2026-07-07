import { useAppStore } from '../../store/appStore'
import { X } from 'lucide-react'

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts)
  const dismiss = useAppStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded border border-border bg-white px-4 py-3 shadow-lg"
        >
          <span className="text-sm text-body">{t.message}</span>
          <button type="button" onClick={() => dismiss(t.id)} className="text-border-form hover:text-body">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
