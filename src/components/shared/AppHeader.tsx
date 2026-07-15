import { PanelLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { UserMenu } from './UserMenu'

interface AppHeaderProps {
  onLogoClick?: () => void
  children?: ReactNode
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
}

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-lg text-border-form transition-colors hover:bg-surface hover:text-brand'

export function AppHeader({
  onLogoClick,
  children,
  sidebarOpen,
  onToggleSidebar,
}: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-white px-3 md:px-4">
      <div className="flex min-w-0 items-center gap-1">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`${iconButtonClass} ${sidebarOpen ? 'bg-surface text-brand' : ''}`}
            aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            aria-expanded={sidebarOpen}
          >
            <PanelLeft className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onLogoClick}
          className="ml-1 cursor-pointer truncate font-serif text-xl font-semibold text-brand hover:opacity-80"
        >
          Parley
        </button>
      </div>
      <div className="flex items-center gap-4">
        {children}
        <UserMenu />
      </div>
    </header>
  )
}
