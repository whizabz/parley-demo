import type { NarrativeSegment } from '../../types'

interface Props {
  segments: NarrativeSegment[]
}

export function NarrativeText({ segments }: Props) {
  return (
    <div className="space-y-2 font-serif text-sm leading-relaxed text-body">
      {segments.map((seg, i) => (
        <p key={i}>{seg.text}</p>
      ))}
    </div>
  )
}
