import type { ReactNode } from 'react'

interface ContentCardProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  selected?: boolean
}

export function ContentCard({ children, onClick, className = '', selected }: ContentCardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={`rounded border border-border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-brand' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
