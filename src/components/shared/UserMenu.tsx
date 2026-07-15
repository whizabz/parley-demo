import { useEffect, useMemo, useRef, useState } from 'react'
import { Archive, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import type { DemoMode } from '../../types'
import { REUSED_REPORT_INFO, TRIAGE_LANE_INFO, getDemoModeInitials } from '../../data/triageLanes'
import { useAppStore } from '../../store/appStore'
import {
  formatLimitResetIn,
  getCreditsBarColor,
  getCreditsUsedPercent,
} from '../../utils/credits'
import { getConversationLabel } from '../../utils/conversations'

type DemoOption = { mode: DemoMode | null; label: string; scaleAbbrev?: string }

type DemoSection = { id: string; label: string; options: DemoOption[] }

const DEMO_TYPE_MENU: DemoSection[] = [
  {
    id: 'automatic',
    label: 'Automatic',
    options: [{ mode: null, label: 'Auto' }],
  },
  {
    id: 'generated',
    label: 'Generated report',
    options: [
      { mode: 'instant', label: TRIAGE_LANE_INFO.instant.label, scaleAbbrev: TRIAGE_LANE_INFO.instant.scaleAbbrev },
      { mode: 'background', label: TRIAGE_LANE_INFO.background.label, scaleAbbrev: TRIAGE_LANE_INFO.background.scaleAbbrev },
      { mode: 'export', label: TRIAGE_LANE_INFO.export.label, scaleAbbrev: TRIAGE_LANE_INFO.export.scaleAbbrev },
    ],
  },
  {
    id: 'library',
    label: 'Library',
    options: [
      { mode: 'reused', label: REUSED_REPORT_INFO.label, scaleAbbrev: REUSED_REPORT_INFO.scaleAbbrev },
    ],
  },
]

function sectionForMode(mode: DemoMode | null): string {
  const match = DEMO_TYPE_MENU.find((section) => section.options.some((o) => o.mode === mode))
  return match?.id ?? 'automatic'
}

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<'main' | 'archived'>('main')
  const [resetLabel, setResetLabel] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const menuRef = useRef<HTMLDivElement>(null)
  const forcedDemoMode = useAppStore((s) => s.forcedDemoMode)
  const setForcedDemoMode = useAppStore((s) => s.setForcedDemoMode)
  const creditsUsed = useAppStore((s) => s.creditsUsed)
  const creditsTotal = useAppStore((s) => s.creditsTotal)
  const creditsResetAt = useAppStore((s) => s.creditsResetAt)
  const shuffleCreditsUsage = useAppStore((s) => s.shuffleCreditsUsage)
  const conversations = useAppStore((s) => s.conversations)
  const loadConversation = useAppStore((s) => s.loadConversation)
  const unarchiveConversation = useAppStore((s) => s.unarchiveConversation)

  const usedPct = getCreditsUsedPercent(creditsUsed, creditsTotal)
  const barColor = getCreditsBarColor(usedPct)

  const archived = useMemo(
    () =>
      conversations
        .filter((c) => c.archived)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [conversations],
  )

  useEffect(() => {
    const updateResetLabel = () => setResetLabel(formatLimitResetIn(creditsResetAt))
    updateResetLabel()
    const interval = setInterval(updateResetLabel, 60_000)
    return () => clearInterval(interval)
  }, [creditsResetAt])

  useEffect(() => {
    if (!open) {
      setPanel('main')
      return
    }
    setExpandedSections(new Set([sectionForMode(forcedDemoMode)]))
  }, [open, forcedDemoMode])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white hover:opacity-90 ${
          forcedDemoMode ? 'ring-2 ring-accent ring-offset-1' : ''
        }`}
        aria-label="User menu"
        aria-expanded={open}
      >
        {getDemoModeInitials(forcedDemoMode)}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded border border-border bg-white py-1 shadow-lg">
          {panel === 'main' ? (
            <>
              <div className="border-b border-border px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-border-form">
                  Compute credits
                </p>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface"
                  onClick={() => shuffleCreditsUsage()}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${usedPct}%`, backgroundColor: barColor }}
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-brand">{usedPct}% used</p>
                <p className="mt-0.5 text-xs text-border-form">{resetLabel}</p>
              </div>

              <button
                type="button"
                onClick={() => setPanel('archived')}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-body hover:bg-surface"
              >
                <span className="flex items-center gap-2">
                  <Archive className="h-3.5 w-3.5 text-border-form" />
                  Archived chats
                </span>
                <span className="flex items-center gap-1 text-xs text-border-form">
                  {archived.length > 0 ? archived.length : null}
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>

              <p className="border-t border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-border-form">
                Demo type
              </p>
              {DEMO_TYPE_MENU.map((section) => {
                const expanded = expandedSections.has(section.id)
                const sectionActive = section.options.some((o) => o.mode === forcedDemoMode)

                return (
                  <div key={section.id}>
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface ${
                        sectionActive ? 'text-brand' : 'text-body'
                      }`}
                    >
                      {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-border-form" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-border-form" />
                      )}
                      <span className={`text-sm ${sectionActive ? 'font-medium' : ''}`}>
                        {section.label}
                      </span>
                    </button>
                    {expanded &&
                      section.options.map((option) => {
                        const active = forcedDemoMode === option.mode
                        return (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => {
                              setForcedDemoMode(option.mode)
                              setOpen(false)
                            }}
                            className={`flex w-full items-center justify-between gap-3 py-2 pl-9 pr-3 text-left hover:bg-surface ${
                              active ? 'text-brand' : 'text-body'
                            }`}
                          >
                            <span className={`text-sm ${active ? 'font-medium' : ''}`}>
                              {option.label}
                            </span>
                            <span className="flex items-center gap-2">
                              {option.scaleAbbrev && (
                                <span className="font-mono text-xs text-border-form">
                                  {option.scaleAbbrev}
                                </span>
                              )}
                              {active && <span className="text-xs text-accent">●</span>}
                            </span>
                          </button>
                        )
                      })}
                  </div>
                )
              })}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPanel('main')}
                className="flex w-full items-center gap-2 border-b border-border px-3 py-2.5 text-left text-sm font-medium text-brand hover:bg-surface"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Archived chats
              </button>
              <div className="max-h-72 overflow-y-auto py-1">
                {archived.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-border-form">No archived chats</p>
                ) : (
                  archived.map((conversation) => {
                    const label = getConversationLabel(conversation)
                    return (
                      <div
                        key={conversation.id}
                        className="group flex items-center gap-1 px-1.5 py-0.5"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            loadConversation(conversation.id)
                            setOpen(false)
                          }}
                          className="min-w-0 flex-1 truncate rounded-md px-2 py-2 text-left text-sm text-body hover:bg-surface"
                          title={label}
                        >
                          {label}
                        </button>
                        <button
                          type="button"
                          onClick={() => unarchiveConversation(conversation.id)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-border-form hover:bg-surface hover:text-brand"
                          aria-label={`Restore ${label}`}
                          title="Restore"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
