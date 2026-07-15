import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { AppHeader } from '../shared/AppHeader'
import { AppSidebar } from './AppSidebar'
import { useAppStore } from '../../store/appStore'
import { useReportSimulation } from '../../hooks/useReportSimulation'

const SIDEBAR_MIN = 200
const SIDEBAR_MAX = 480
const SIDEBAR_DEFAULT = 256
const SIDEBAR_WIDTH_KEY = 'parley-sidebar-width'

function clampSidebarWidth(width: number) {
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(width)))
}

function readStoredSidebarWidth() {
  try {
    const raw = localStorage.getItem(SIDEBAR_WIDTH_KEY)
    const value = raw == null ? NaN : Number(raw)
    if (Number.isFinite(value)) return clampSidebarWidth(value)
  } catch {
    // ignore
  }
  return SIDEBAR_DEFAULT
}

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  useReportSimulation()

  const goHome = useAppStore((s) => s.goHome)
  const canvasOpen = useAppStore((s) => s.canvasOpen)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(readStoredSidebarWidth)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    if (canvasOpen) setSidebarOpen(false)
  }, [canvasOpen])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth))
    } catch {
      // ignore
    }
  }, [sidebarWidth])

  useEffect(() => {
    if (!isResizing) return

    const previousUserSelect = document.body.style.userSelect
    const previousCursor = document.body.style.cursor
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    const onPointerMove = (event: PointerEvent) => {
      setSidebarWidth(clampSidebarWidth(event.clientX))
    }

    const onPointerUp = () => setIsResizing(false)

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      document.body.style.userSelect = previousUserSelect
      document.body.style.cursor = previousCursor
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [isResizing])

  const onResizePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsResizing(true)
  }, [])

  return (
    <div className="flex h-screen bg-white">
      <div
        className={`relative h-full shrink-0 overflow-hidden ${
          isResizing ? '' : 'transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]'
        }`}
        style={{ width: sidebarOpen ? sidebarWidth : 0 }}
        aria-hidden={!sidebarOpen}
      >
        <div className="h-full" style={{ width: sidebarWidth }}>
          <AppSidebar />
        </div>
        {sidebarOpen && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            aria-valuemin={SIDEBAR_MIN}
            aria-valuemax={SIDEBAR_MAX}
            aria-valuenow={sidebarWidth}
            onPointerDown={onResizePointerDown}
            className={`absolute inset-y-0 right-0 z-20 w-1.5 translate-x-1/2 cursor-col-resize touch-none ${
              isResizing ? 'bg-brand/40' : 'bg-transparent hover:bg-brand/25'
            }`}
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          onLogoClick={goHome}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />
        <main className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
