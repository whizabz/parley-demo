import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Archive, MoreVertical, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import type { Conversation } from '../../types'
import { useAppStore } from '../../store/appStore'
import { getConversationLabel } from '../../utils/conversations'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { RenameChatDialog } from '../shared/RenameChatDialog'

interface ConversationMenuProps {
  conversation: Conversation
  status?: 'ready' | 'working' | null
}

type MenuAction = 'rename' | 'archive' | 'delete' | null

export function ConversationMenu({
  conversation,
  status = null,
}: ConversationMenuProps) {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<MenuAction>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const pinConversation = useAppStore((s) => s.pinConversation)
  const unpinConversation = useAppStore((s) => s.unpinConversation)
  const renameConversation = useAppStore((s) => s.renameConversation)
  const archiveConversation = useAppStore((s) => s.archiveConversation)
  const deleteConversation = useAppStore((s) => s.deleteConversation)

  const label = getConversationLabel(conversation)
  const pinned = conversation.pinned

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const menuWidth = 176
    const menuHeight = 180
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
        {status && (
          <span
            className={`pointer-events-none absolute h-2 w-2 rounded-full ${
              open ? 'hidden' : 'group-hover:hidden'
            } ${status === 'ready' ? 'bg-brand' : 'animate-pulse bg-border-form'}`}
            aria-hidden
          />
        )}
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
            className="fixed z-[70] w-44 rounded-lg border border-border bg-white py-1 shadow-lg"
            style={{ top: coords.top, left: coords.left }}
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-body hover:bg-surface"
              onClick={() => {
                setOpen(false)
                if (pinned) unpinConversation(conversation.id)
                else pinConversation(conversation.id)
              }}
            >
              {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              {pinned ? 'Unpin' : 'Pin'}
            </button>
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
                setAction('archive')
              }}
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-surface"
              onClick={() => {
                setOpen(false)
                setAction('delete')
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>,
          document.body,
        )}

      <RenameChatDialog
        open={action === 'rename'}
        initialName={label}
        onCancel={() => setAction(null)}
        onSave={(name) => {
          renameConversation(conversation.id, name)
          setAction(null)
        }}
      />

      <ConfirmDialog
        open={action === 'archive'}
        title="Archive this chat?"
        message="It will leave your sidebar. You can find it later under Archived chats in your profile menu."
        confirmLabel="Archive"
        onCancel={() => setAction(null)}
        onConfirm={() => {
          archiveConversation(conversation.id)
          setAction(null)
        }}
      />

      <ConfirmDialog
        open={action === 'delete'}
        title="Delete this chat?"
        message="This permanently removes the chat and its history. This can't be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setAction(null)}
        onConfirm={() => {
          deleteConversation(conversation.id)
          setAction(null)
        }}
      />
    </>
  )
}
