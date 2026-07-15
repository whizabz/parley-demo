import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BookmarkMinus, Globe, MoreVertical, Pencil } from 'lucide-react'
import type { Version } from '../../types'
import { useAppStore } from '../../store/appStore'
import { getArtifactDisplayName } from '../../utils/artifacts'
import { ConfirmDialog } from './ConfirmDialog'
import { PublishArtifactDialog } from './PublishArtifactDialog'
import { RenameChatDialog } from './RenameChatDialog'

interface ArtifactMenuProps {
  version: Version
}

type MenuAction = 'rename' | 'publish' | 'unsave' | null

export function ArtifactMenu({ version }: ArtifactMenuProps) {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<MenuAction>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const renameArtifact = useAppStore((s) => s.renameArtifact)
  const removeBookmark = useAppStore((s) => s.removeBookmark)
  const addToast = useAppStore((s) => s.addToast)

  const label = getArtifactDisplayName(version)

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const menuWidth = 176
    const menuHeight = 140
    const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)
    const openUp = rect.bottom + menuHeight > window.innerHeight - 8
    const top = openUp ? rect.top - menuHeight - 4 : rect.bottom + 4
    setCoords({ top: Math.max(8, top), left: Math.max(8, left) })
  }, [open])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <>
      <div className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center">
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((value) => !value)
          }}
          className={`flex h-7 w-7 items-center justify-center rounded-md text-border-form transition-opacity hover:bg-white hover:text-brand ${
            open
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
          }`}
          aria-label={`More options for ${label}`}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </div>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[90] w-44 rounded-lg border border-border bg-white py-1 shadow-lg"
            style={{ top: coords.top, left: coords.left }}
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-body hover:bg-surface"
              onClick={() => {
                setOpen(false)
                setAction('rename')
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-body hover:bg-surface"
              onClick={() => {
                setOpen(false)
                setAction('publish')
              }}
            >
              <Globe className="h-3.5 w-3.5" />
              Publish
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-surface"
              onClick={() => {
                setOpen(false)
                setAction('unsave')
              }}
            >
              <BookmarkMinus className="h-3.5 w-3.5" />
              Unsave
            </button>
          </div>,
          document.body,
        )}

      <RenameChatDialog
        open={action === 'rename'}
        initialName={label}
        title="Rename artifact"
        description="Choose a name you’ll recognize in your library."
        fieldLabel="Name"
        placeholder="Name this artifact"
        onCancel={() => setAction(null)}
        onSave={(name) => {
          renameArtifact(version.id, name)
          setAction(null)
        }}
      />

      <PublishArtifactDialog
        open={action === 'publish'}
        version={version}
        onCancel={() => setAction(null)}
        onSubmit={() => {
          addToast('Submitted for governance review.')
          setAction(null)
        }}
      />

      <ConfirmDialog
        open={action === 'unsave'}
        title="Unsave artifact?"
        message="This will leave your artifacts. You can save it again later from the report."
        confirmLabel="Unsave"
        destructive
        onCancel={() => setAction(null)}
        onConfirm={() => {
          removeBookmark(version.id)
          setAction(null)
        }}
      />
    </>
  )
}
