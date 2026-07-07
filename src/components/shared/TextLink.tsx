import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

interface TextLinkProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function TextLink({ children, onClick, className = '' }: TextLinkProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      className={`inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </button>
  )
}
