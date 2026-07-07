import { useRef, useState, type ReactNode } from 'react'
import { AppHeader } from '../shared/AppHeader'
import { AppSidebar } from './AppSidebar'
import { useAppStore } from '../../store/appStore'

interface AppShellProps {
  children: ReactNode
}

const SIDEBAR_CLOSE_DELAY_MS = 300

export function AppShell({ children }: AppShellProps) {
  const goHome = useAppStore((s) => s.goHome)
  const startNewChat = useAppStore((s) => s.startNewChat)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const openSidebar = () => {
    clearCloseTimer()
    setSidebarOpen(true)
  }

  const closeSidebar = () => {
    clearCloseTimer()
    setSidebarOpen(false)
  }

  const scheduleCloseSidebar = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setSidebarOpen(false)
      closeTimerRef.current = null
    }, SIDEBAR_CLOSE_DELAY_MS)
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <AppHeader
        onLogoClick={goHome}
        sidebarOpen={sidebarOpen}
        onSidebarIconMouseEnter={openSidebar}
        onSidebarIconMouseLeave={scheduleCloseSidebar}
        onSidebarIconClick={closeSidebar}
        onNewChat={startNewChat}
      />
      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen && (
          <button
            type="button"
            className="absolute inset-0 z-10 cursor-default"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          />
        )}
        <main className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
        <AppSidebar
          open={sidebarOpen}
          onMouseEnter={openSidebar}
          onMouseLeave={scheduleCloseSidebar}
        />
      </div>
    </div>
  )
}
