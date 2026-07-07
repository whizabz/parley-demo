import { Bookmark } from 'lucide-react'

interface BookmarkButtonProps {
  bookmarked: boolean
  onClick: () => void
  size?: 'sm' | 'md'
  className?: string
}

export function BookmarkButton({
  bookmarked,
  onClick,
  size = 'md',
  className = 'p-1',
}: BookmarkButtonProps) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`rounded text-brand hover:bg-highlight ${className}`}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark report'}
    >
      <Bookmark className={`${iconSize} ${bookmarked ? 'fill-brand' : ''}`} />
    </button>
  )
}
