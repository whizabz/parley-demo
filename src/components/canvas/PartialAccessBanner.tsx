import { ShieldAlert } from 'lucide-react'
import type { Version } from '../../types'

interface PartialAccessBannerProps {
  version: Version
}

export function PartialAccessBanner({ version }: PartialAccessBannerProps) {
  if (version.failureKind !== 'partial') return null

  const sources = version.restrictedSources?.join(', ') ?? 'restricted sources'
  const owner = version.restrictedSourceOwner ?? 'the owning team'

  return (
    <div className="mx-4 mb-3 flex items-start gap-2.5 rounded-xl border border-impact/25 bg-impact/5 px-3.5 py-2.5">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-impact" />
      <div className="min-w-0 text-sm leading-relaxed text-body">
        <p className="font-medium text-impact">Partial access</p>
        <p className="mt-0.5 text-border-form">
          {sources} excluded — owned by {owner}. Figures below use only sources you can see.
        </p>
      </div>
    </div>
  )
}
