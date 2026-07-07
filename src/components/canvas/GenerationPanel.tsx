import type { ReactNode } from 'react'

interface GenerationPanelProps {
  title: string
  notice?: string | null
  children: ReactNode
}

export function GenerationPanel({ title, notice, children }: GenerationPanelProps) {
  return (
    <div className="p-6">
      <div className="rounded border border-border bg-white p-5 shadow-sm">
        <p className="font-serif text-lg text-brand">{title}</p>
        {notice && <p className="mt-2 text-sm leading-relaxed text-body">{notice}</p>}
        <div className={notice ? 'mt-4' : 'mt-4'}>{children}</div>
      </div>
    </div>
  )
}
