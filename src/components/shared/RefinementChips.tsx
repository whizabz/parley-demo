interface RefinementChipsProps {
  chips: string[]
  onSelect: (chip: string) => void
  className?: string
  stopPropagation?: boolean
}

export function RefinementChips({
  chips,
  onSelect,
  className = '',
  stopPropagation = false,
}: RefinementChipsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={(e) => {
            if (stopPropagation) e.stopPropagation()
            onSelect(chip)
          }}
          className="rounded border border-border-form bg-white px-3 py-1 text-xs text-brand hover:border-brand hover:bg-highlight"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
