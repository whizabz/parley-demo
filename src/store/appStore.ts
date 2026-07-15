import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type {
  Conversation,
  DemoMode,
  ResponseKind,
  SimulationPhase,
  Toast,
  TriageOutcome,
  Version,
  VersionFeedback,
  View,
} from '../types'
import {
  applyReuseOverride,
  findScenario,
  resolveScenario,
  scenarioToReport,
  scenarios,
} from '../data/scenarios'
import {
  resolveTriageOutcome,
  scenarioForOutcome,
  AUTO_TRIAGE_OUTCOME_ORDER,
  SHARED_PREFIX_LENGTH,
} from '../data/triageFlow'
import {
  compactPinOrders,
  setConversationUnread,
  syncConversationVersions,
  upsertConversation,
} from '../utils/conversations'
import { versionHasVisualization } from '../utils/canvas'
import { sampleArtifacts, sampleConversations } from '../data/sampleConversations'

const CREDIT_COSTS = { instant: 1, background: 3, export: 2 } as const

interface AppState {
  view: View
  versions: Version[]
  activeVersionId: string | null
  selectedCardId: string | null
  contextualFollowUpChips: string[] | null
  /** Follow-up chips shown above the chat composer; cleared on send. */
  composerChips: string[] | null
  simulationPhase: SimulationPhase
  thinkingStep: number
  revealedCardCount: number
  pendingScenarioId: string | null
  loadingVersionId: string | null
  loadingConversationId: string | null
  creditsUsed: number
  creditsTotal: number
  creditsResetAt: string
  toasts: Toast[]
  validationOpen: boolean
  favoritedReports: Version[]
  conversations: Conversation[]
  activeConversationId: string | null
  forcedDemoMode: DemoMode | null
  triageOutcome: TriageOutcome | null
  pendingBaseScenarioId: string | null
  bookmarkPromptVersionId: string | null
  autoOutcomeIndex: number
  canvasOpen: boolean
  libraryOpen: boolean

  goHome: () => void
  startNewChat: () => void
  openWorkspace: () => void
  startNewQuestion: (question: string) => void
  submitQuestion: (question: string) => void
  setActiveVersion: (id: string) => void
  goToLatest: () => void
  openBookmarkPrompt: (versionId: string) => void
  cancelBookmarkPrompt: () => void
  confirmBookmark: (name: string) => void
  removeBookmark: (versionId: string) => void
  renameArtifact: (versionId: string, name: string) => void
  pinConversation: (conversationId: string) => void
  unpinConversation: (conversationId: string) => void
  reorderPinnedConversations: (orderedIds: string[]) => void
  renameConversation: (conversationId: string, title: string) => void
  archiveConversation: (conversationId: string) => void
  unarchiveConversation: (conversationId: string) => void
  deleteConversation: (conversationId: string) => void
  setVersionFeedback: (versionId: string, feedback: VersionFeedback | null) => void
  submitVersionFeedbackComment: (versionId: string, comment: string) => void
  selectCard: (cardId: string, chips: string[]) => void
  clearCardSelection: () => void
  setSimulationPhase: (phase: SimulationPhase) => void
  setThinkingStep: (step: number) => void
  incrementRevealedCards: () => void
  completeSimulation: () => void
  addToast: (message: string) => void
  dismissToast: (id: string) => void
  openValidation: () => void
  closeValidation: () => void
  loadSavedReport: (versionId: string) => void
  loadConversation: (conversationId: string) => void
  setForcedDemoMode: (mode: DemoMode | null) => void
  shuffleCreditsUsage: () => void
  resolveReuseReport: (action: 'use' | 'generate-new') => void
  openCanvas: () => void
  closeCanvas: () => void
  openLibrary: () => void
  closeLibrary: () => void
  resolveClarification: (
    versionId: string,
    optionId: string,
    customText?: string,
  ) => void
}

function makeVersion(
  question: string,
  scenario: NonNullable<ReturnType<typeof findScenario>>,
  responseKind: ResponseKind = 'report',
): Version {
  const report = scenarioToReport(scenario)
  if (responseKind === 'text' || responseKind === 'clarify') {
    report.cards = []
  }
  return {
    id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    question,
    summary: scenario.summary,
    report,
    narrative: scenario.narrative,
    refinementChips: responseKind === 'clarify' ? [] : scenario.refinementChips,
    responseKind,
    createdAt: new Date().toISOString(),
    favorited: false,
    clarificationOptions:
      responseKind === 'clarify' ? scenario.clarificationOptions : undefined,
  }
}

function patchVersionFromScenario(version: Version, scenario: ReturnType<typeof resolveScenario>, question: string): Version {
  const report = scenarioToReport({ ...scenario, question })
  return {
    ...version,
    question,
    summary: scenario.summary,
    report: { ...report, question },
    narrative: scenario.narrative,
    refinementChips: scenario.refinementChips,
  }
}

function chipsFromVersion(version: Version | undefined | null): string[] | null {
  if (!version || version.responseKind === 'clarify') return null
  if (!version.refinementChips?.length) return null
  return [...version.refinementChips]
}

function patchVersionEverywhere(
  s: {
    versions: Version[]
    favoritedReports: Version[]
    conversations: Conversation[]
  },
  versionId: string,
  patch: (version: Version) => Version,
) {
  const versions = s.versions.map((v) => (v.id === versionId ? patch(v) : v))
  const favoritedReports = s.favoritedReports.map((v) =>
    v.id === versionId ? patch(v) : v,
  )
  const conversations = s.conversations.map((c) => ({
    ...c,
    versions: c.versions.map((v) => (v.id === versionId ? patch(v) : v)),
  }))
  return { versions, favoritedReports, conversations }
}

function applyQuestion(
  question: string,
  scenario: NonNullable<ReturnType<typeof findScenario>>,
  triageOutcome: TriageOutcome,
  baseScenarioId: string,
  creditsUsed: number,
  creditsTotal: number,
  freshSession: boolean,
  existingVersions: Version[],
) {
  const responseKind: ResponseKind =
    triageOutcome === 'text' ? 'text' : triageOutcome === 'clarify' ? 'clarify' : 'report'
  const cost =
    responseKind === 'text' || responseKind === 'clarify'
      ? 0
      : CREDIT_COSTS[
          scenario.triageLane === 'export'
            ? 'export'
            : scenario.triageLane === 'background'
              ? 'background'
              : 'instant'
        ]
  const version = makeVersion(question, scenario, responseKind)
  const versions = freshSession ? [version] : [...existingVersions, version]

  return {
    view: 'workspace' as const,
    versions,
    activeVersionId: version.id,
    loadingVersionId: version.id,
    simulationPhase: 'discovering' as SimulationPhase,
    thinkingStep: 0,
    revealedCardCount: 0,
    pendingScenarioId: scenario.id,
    pendingBaseScenarioId: baseScenarioId,
    triageOutcome,
    selectedCardId: null,
    contextualFollowUpChips: null,
    composerChips: null,
    creditsUsed: Math.min(creditsUsed + cost, creditsTotal),
    canvasOpen: false,
  }
}

function isSimulationActive(phase: SimulationPhase): boolean {
  return (
    phase === 'discovering' ||
    phase === 'thinking' ||
    phase === 'background-wait' ||
    phase === 'revealing' ||
    phase === 'triage-prompt'
  )
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: 'home',
      versions: [],
      activeVersionId: null,
      selectedCardId: null,
      contextualFollowUpChips: null,
      composerChips: null,
      simulationPhase: 'idle',
      thinkingStep: 0,
      revealedCardCount: 0,
      pendingScenarioId: null,
      loadingVersionId: null,
      loadingConversationId: null,
      creditsUsed: 38,
      creditsTotal: 100,
      creditsResetAt: new Date(Date.now() + (2 * 60 + 47) * 60 * 1000).toISOString(),
      toasts: [],
      validationOpen: false,
      favoritedReports: sampleArtifacts,
      conversations: sampleConversations,
      activeConversationId: null,
      forcedDemoMode: null,
      triageOutcome: null,
      pendingBaseScenarioId: null,
      bookmarkPromptVersionId: null,
      autoOutcomeIndex: 0,
      canvasOpen: false,
      libraryOpen: false,

      goHome: () => {
        const s = get()
        const conversations =
          s.activeConversationId && s.versions.length > 0
            ? upsertConversation(s.conversations, s.activeConversationId, s.versions)
            : s.conversations
        const keepJob = isSimulationActive(s.simulationPhase) && !!s.loadingConversationId

        set({
          view: 'home',
          versions: [],
          activeVersionId: null,
          activeConversationId: null,
          selectedCardId: null,
          contextualFollowUpChips: null,
          canvasOpen: false,
          conversations,
          composerChips: null,
          ...(keepJob
            ? {}
            : {
                simulationPhase: 'idle' as SimulationPhase,
                triageOutcome: null,
                pendingBaseScenarioId: null,
                pendingScenarioId: null,
                loadingVersionId: null,
                loadingConversationId: null,
                thinkingStep: 0,
                revealedCardCount: 0,
              }),
        })
      },

      startNewChat: () => {
        const s = get()
        const conversations =
          s.activeConversationId && s.versions.length > 0
            ? upsertConversation(s.conversations, s.activeConversationId, s.versions)
            : s.conversations
        const keepJob = isSimulationActive(s.simulationPhase) && !!s.loadingConversationId

        set({
          view: 'home',
          versions: [],
          activeVersionId: null,
          activeConversationId: null,
          selectedCardId: null,
          contextualFollowUpChips: null,
          canvasOpen: false,
          conversations,
          composerChips: null,
          ...(keepJob
            ? {}
            : {
                simulationPhase: 'idle' as SimulationPhase,
                triageOutcome: null,
                pendingBaseScenarioId: null,
                pendingScenarioId: null,
                loadingVersionId: null,
                loadingConversationId: null,
                thinkingStep: 0,
                revealedCardCount: 0,
              }),
        })
      },

      openCanvas: () => set({ canvasOpen: true }),

      closeCanvas: () =>
        set((s) => {
          const version = s.versions.find((v) => v.id === s.activeVersionId)
          return {
            canvasOpen: false,
            selectedCardId: null,
            contextualFollowUpChips: null,
            composerChips:
              s.simulationPhase === 'complete' ? chipsFromVersion(version) : s.composerChips,
          }
        }),

      openWorkspace: () => set({ view: 'workspace' }),

      startNewQuestion: (question: string) => {
        const prev = get()
        // Finish any prior in-flight job before starting a new conversation.
        if (isSimulationActive(prev.simulationPhase) && prev.loadingConversationId) {
          get().completeSimulation()
        }

        const base = resolveScenario(question)
        const { forcedDemoMode, autoOutcomeIndex } = get()
        const outcome = resolveTriageOutcome(base, forcedDemoMode, autoOutcomeIndex)
        const scenario = scenarioForOutcome(base, outcome)
        const nextAutoOutcomeIndex =
          forcedDemoMode === null
            ? (autoOutcomeIndex + 1) % AUTO_TRIAGE_OUTCOME_ORDER.length
            : autoOutcomeIndex
        const conversationId = `conv-${Date.now()}`
        set((s) => {
          const applied = applyQuestion(
            question,
            scenario,
            outcome,
            base.id,
            s.creditsUsed,
            s.creditsTotal,
            true,
            s.versions,
          )
          return {
            ...applied,
            autoOutcomeIndex: nextAutoOutcomeIndex,
            activeConversationId: conversationId,
            loadingConversationId: conversationId,
            conversations: upsertConversation(
              s.conversations,
              conversationId,
              applied.versions,
              { touchActivity: true },
            ),
          }
        })
      },

      submitQuestion: (question: string) => {
        const prev = get()
        if (isSimulationActive(prev.simulationPhase) && prev.loadingConversationId) {
          get().completeSimulation()
        }

        const base = resolveScenario(question)
        const { forcedDemoMode, autoOutcomeIndex } = get()
        const outcome = resolveTriageOutcome(base, forcedDemoMode, autoOutcomeIndex)
        const scenario = scenarioForOutcome(base, outcome)
        const nextAutoOutcomeIndex =
          forcedDemoMode === null
            ? (autoOutcomeIndex + 1) % AUTO_TRIAGE_OUTCOME_ORDER.length
            : autoOutcomeIndex
        set((s) => {
          const conversationId = s.activeConversationId ?? `conv-${Date.now()}`
          const applied = applyQuestion(
            question,
            scenario,
            outcome,
            base.id,
            s.creditsUsed,
            s.creditsTotal,
            false,
            s.versions,
          )
          return {
            ...applied,
            autoOutcomeIndex: nextAutoOutcomeIndex,
            activeConversationId: conversationId,
            loadingConversationId: conversationId,
            conversations: upsertConversation(
              s.conversations,
              conversationId,
              applied.versions,
              { touchActivity: true },
            ),
          }
        })
      },

      setActiveVersion: (id: string) =>
        set((s) => {
          const version = s.versions.find((v) => v.id === id)
          return {
            activeVersionId: id,
            selectedCardId: null,
            contextualFollowUpChips: null,
            composerChips:
              s.simulationPhase === 'complete' ? chipsFromVersion(version) : null,
          }
        }),

      goToLatest: () => {
        const { versions } = get()
        if (versions.length === 0) return
        const latest = versions[versions.length - 1]
        set((s) => ({
          activeVersionId: latest.id,
          selectedCardId: null,
          contextualFollowUpChips: null,
          composerChips:
            s.simulationPhase === 'complete' ? chipsFromVersion(latest) : null,
        }))
      },

      openBookmarkPrompt: (versionId: string) => set({ bookmarkPromptVersionId: versionId }),

      cancelBookmarkPrompt: () => set({ bookmarkPromptVersionId: null }),

      confirmBookmark: (name: string) => {
        const { bookmarkPromptVersionId, versions, favoritedReports, conversations, activeConversationId } = get()
        if (!bookmarkPromptVersionId) return

        const target =
          versions.find((v) => v.id === bookmarkPromptVersionId) ??
          favoritedReports.find((v) => v.id === bookmarkPromptVersionId)
        if (!target) return

        const updated = { ...target, favorited: true, bookmarkName: name.trim() }
        const nextVersions = versions.some((v) => v.id === bookmarkPromptVersionId)
          ? versions.map((v) => (v.id === bookmarkPromptVersionId ? updated : v))
          : versions
        const nextFavorited = [
          updated,
          ...favoritedReports.filter((f) => f.id !== bookmarkPromptVersionId),
        ]
        const nextConversations = activeConversationId
          ? syncConversationVersions(
              upsertConversation(conversations, activeConversationId, nextVersions),
              activeConversationId,
              nextVersions,
            )
          : conversations.map((c) => ({
              ...c,
              versions: c.versions.map((v) =>
                v.id === bookmarkPromptVersionId ? updated : v,
              ),
            }))

        set({
          versions: nextVersions,
          favoritedReports: nextFavorited,
          conversations: nextConversations,
          bookmarkPromptVersionId: null,
        })
        get().addToast('Saved to your library.')
      },

      removeBookmark: (versionId: string) =>
        set((s) => {
          const target =
            s.versions.find((v) => v.id === versionId) ??
            s.favoritedReports.find((v) => v.id === versionId)
          if (!target) return s

          const updated = { ...target, favorited: false, bookmarkName: undefined }
          const versions = s.versions.some((v) => v.id === versionId)
            ? s.versions.map((v) => (v.id === versionId ? updated : v))
            : s.versions
          const favoritedReports = s.favoritedReports.filter((f) => f.id !== versionId)
          const conversations = s.conversations.map((c) => ({
            ...c,
            versions: c.versions.map((v) => (v.id === versionId ? updated : v)),
          }))

          return { versions, favoritedReports, conversations }
        }),

      renameArtifact: (versionId: string, name: string) => {
        const trimmed = name.trim()
        if (!trimmed) return
        set((s) => {
          const update = (v: Version) =>
            v.id === versionId ? { ...v, bookmarkName: trimmed } : v
          return {
            versions: s.versions.map(update),
            favoritedReports: s.favoritedReports.map(update),
            conversations: s.conversations.map((c) => ({
              ...c,
              versions: c.versions.map(update),
            })),
          }
        })
      },

      pinConversation: (conversationId: string) =>
        set((s) => {
          const now = new Date().toISOString()
          const next = s.conversations.map((c) => {
            if (c.id === conversationId && !c.archived) {
              return { ...c, pinned: true, pinnedAt: now, pinOrder: 0 }
            }
            if (c.pinned && !c.archived) {
              return { ...c, pinOrder: (c.pinOrder ?? 0) + 1 }
            }
            return c
          })
          return { conversations: next }
        }),

      unpinConversation: (conversationId: string) => {
        set((s) => {
          const next = s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, pinned: false, pinnedAt: undefined, pinOrder: undefined }
              : c,
          )
          return { conversations: compactPinOrders(next) }
        })
      },

      reorderPinnedConversations: (orderedIds: string[]) => {
        const orderMap = new Map(orderedIds.map((id, index) => [id, index]))
        set((s) => ({
          conversations: s.conversations.map((c) =>
            orderMap.has(c.id) ? { ...c, pinOrder: orderMap.get(c.id)! } : c,
          ),
        }))
      },

      renameConversation: (conversationId: string, title: string) => {
        const trimmed = title.trim()
        if (!trimmed) return
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, customTitle: trimmed, updatedAt: new Date().toISOString() }
              : c,
          ),
        }))
      },

      archiveConversation: (conversationId: string) => {
        const s = get()
        let conversations =
          s.activeConversationId && s.versions.length > 0
            ? upsertConversation(s.conversations, s.activeConversationId, s.versions)
            : s.conversations

        conversations = compactPinOrders(
          conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  archived: true,
                  pinned: false,
                  pinnedAt: undefined,
                  pinOrder: undefined,
                  hasUnread: false,
                }
              : c,
          ),
        )

        const leaving = s.activeConversationId === conversationId
        const clearingJob = s.loadingConversationId === conversationId
        const keepJob =
          isSimulationActive(s.simulationPhase) &&
          !!s.loadingConversationId &&
          !clearingJob
        const clearSim = clearingJob || (leaving && !keepJob)

        set({
          conversations,
          ...(leaving
            ? {
                view: 'home' as const,
                versions: [],
                activeVersionId: null,
                activeConversationId: null,
                selectedCardId: null,
                contextualFollowUpChips: null,
                canvasOpen: false,
              }
            : {}),
          ...(clearSim
            ? {
                simulationPhase: 'idle' as SimulationPhase,
                triageOutcome: null,
                pendingBaseScenarioId: null,
                pendingScenarioId: null,
                loadingVersionId: null,
                loadingConversationId: null,
                thinkingStep: 0,
                revealedCardCount: 0,
              }
            : {}),
        })
        get().addToast('Chat archived.')
      },

      unarchiveConversation: (conversationId: string) => {
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c
            return {
              ...c,
              archived: false,
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
        get().addToast('Chat restored.')
      },

      deleteConversation: (conversationId: string) => {
        const s = get()
        const conversation = s.conversations.find((c) => c.id === conversationId)
        if (!conversation) return

        const versionIds = new Set(conversation.versions.map((v) => v.id))
        const conversations = s.conversations.filter((c) => c.id !== conversationId)
        const favoritedReports = s.favoritedReports.filter((v) => !versionIds.has(v.id))
        const leaving = s.activeConversationId === conversationId
        const clearingJob = s.loadingConversationId === conversationId
        const keepJob =
          isSimulationActive(s.simulationPhase) &&
          !!s.loadingConversationId &&
          !clearingJob
        const clearSim = clearingJob || (leaving && !keepJob)

        set({
          conversations,
          favoritedReports,
          ...(leaving
            ? {
                view: 'home' as const,
                versions: [],
                activeVersionId: null,
                activeConversationId: null,
                selectedCardId: null,
                contextualFollowUpChips: null,
                canvasOpen: false,
              }
            : {}),
          ...(clearSim
            ? {
                simulationPhase: 'idle' as SimulationPhase,
                triageOutcome: null,
                pendingBaseScenarioId: null,
                pendingScenarioId: null,
                loadingVersionId: null,
                loadingConversationId: null,
                thinkingStep: 0,
                revealedCardCount: 0,
              }
            : {}),
        })
        get().addToast('Chat deleted.')
      },

      setVersionFeedback: (versionId, feedback) => {
        set((s) =>
          patchVersionEverywhere(s, versionId, (v) => ({
            ...v,
            feedback,
            feedbackComment: feedback === 'down' ? v.feedbackComment : undefined,
          })),
        )
        if (feedback === 'up') get().addToast('Thanks for the feedback.')
      },

      submitVersionFeedbackComment: (versionId, comment) => {
        const trimmed = comment.trim()
        set((s) =>
          patchVersionEverywhere(s, versionId, (v) => ({
            ...v,
            feedback: 'down',
            feedbackComment: trimmed || undefined,
          })),
        )
        get().addToast(trimmed ? 'Thanks for the feedback.' : 'Feedback saved.')
      },

      selectCard: (cardId: string, chips: string[]) =>
        set({
          selectedCardId: cardId,
          contextualFollowUpChips: chips,
          composerChips: chips.length > 0 ? chips : null,
        }),

      clearCardSelection: () =>
        set((s) => {
          const version = s.versions.find((v) => v.id === s.activeVersionId)
          return {
            selectedCardId: null,
            contextualFollowUpChips: null,
            composerChips:
              s.simulationPhase === 'complete' ? chipsFromVersion(version) : null,
          }
        }),

      setSimulationPhase: (phase) => set({ simulationPhase: phase }),

      setThinkingStep: (step) => set({ thinkingStep: step }),

      incrementRevealedCards: () =>
        set((s) => ({ revealedCardCount: s.revealedCardCount + 1 })),

      completeSimulation: () => {
        const s = get()
        const jobConversationId = s.loadingConversationId ?? s.activeConversationId
        const versionsForJob =
          jobConversationId && s.activeConversationId === jobConversationId
            ? s.versions
            : jobConversationId
              ? (s.conversations.find((c) => c.id === jobConversationId)?.versions ??
                s.versions)
              : s.versions

        let conversations =
          jobConversationId && versionsForJob.length > 0
            ? upsertConversation(s.conversations, jobConversationId, versionsForJob, {
                touchActivity: true,
              })
            : s.conversations

        const focusedOnJob =
          s.view === 'workspace' && s.activeConversationId === jobConversationId
        const markReady = !!jobConversationId && !focusedOnJob
        const alreadyNotified = s.triageOutcome === 'background'

        if (markReady && jobConversationId) {
          conversations = setConversationUnread(conversations, jobConversationId, true)
        }

        const latestVersion = versionsForJob[versionsForJob.length - 1]

        set({
          conversations,
          simulationPhase: s.view === 'home' && !focusedOnJob ? 'idle' : 'complete',
          pendingScenarioId: null,
          loadingVersionId: null,
          loadingConversationId: null,
          triageOutcome: null,
          pendingBaseScenarioId: null,
          thinkingStep: 0,
          ...(focusedOnJob
            ? { composerChips: chipsFromVersion(latestVersion) }
            : {}),
        })

        if (markReady && !alreadyNotified) {
          get().addToast('Your answer is ready.')
        }
      },

      addToast: (message: string) => {
        const id = `toast-${Date.now()}`
        set((s) => ({ toasts: [...s.toasts, { id, message }] }))
        setTimeout(() => get().dismissToast(id), 5000)
      },

      dismissToast: (id: string) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      openValidation: () => set({ validationOpen: true }),

      closeValidation: () => set({ validationOpen: false }),

      loadSavedReport: (versionId: string) => {
        const saved =
          get().favoritedReports.find((v) => v.id === versionId) ??
          get().versions.find((v) => v.id === versionId)
        if (!saved) return

        const conversation =
          get().conversations.find((c) => c.versions.some((v) => v.id === versionId)) ??
          null

        set({
          view: 'workspace',
          versions: conversation?.versions ?? [saved],
          activeVersionId: versionId,
          activeConversationId: conversation?.id ?? null,
          simulationPhase: 'complete',
          loadingVersionId: null,
          selectedCardId: null,
          contextualFollowUpChips: null,
          composerChips: chipsFromVersion(saved),
          canvasOpen: versionHasVisualization(saved),
          libraryOpen: false,
        })
      },

      openLibrary: () => set({ libraryOpen: true }),

      closeLibrary: () => set({ libraryOpen: false }),

      resolveClarification: (versionId, optionId, customText) => {
        const s = get()
        const version = s.versions.find((v) => v.id === versionId)
        if (!version?.clarificationOptions?.length || version.selectedClarificationId) return

        const option = version.clarificationOptions.find((o) => o.id === optionId)
        if (!option) return

        const nextQuestion = option.allowsCustom
          ? customText?.trim()
          : option.submitQuestion?.trim()
        if (!nextQuestion) return

        const patched = patchVersionEverywhere(s, versionId, (v) => ({
          ...v,
          selectedClarificationId: optionId,
        }))
        set(patched)
        get().submitQuestion(nextQuestion)
      },

      loadConversation: (conversationId: string) => {
        const s = get()
        if (s.activeConversationId === conversationId && s.view === 'workspace') return

        const flushed =
          s.activeConversationId && s.versions.length > 0
            ? upsertConversation(s.conversations, s.activeConversationId, s.versions)
            : s.conversations

        const conversation = flushed.find((c) => c.id === conversationId)
        if (!conversation || conversation.versions.length === 0) return

        const activeVersion = conversation.versions[conversation.versions.length - 1]
        const jobInThisChat =
          s.loadingConversationId === conversationId &&
          !!s.loadingVersionId &&
          isSimulationActive(s.simulationPhase)

        set({
          view: 'workspace',
          versions: conversation.versions,
          activeVersionId: jobInThisChat ? s.loadingVersionId : activeVersion.id,
          activeConversationId: conversationId,
          conversations: setConversationUnread(flushed, conversationId, false),
          selectedCardId: null,
          contextualFollowUpChips: null,
          canvasOpen: false,
          composerChips: jobInThisChat ? null : chipsFromVersion(activeVersion),
          ...(jobInThisChat
            ? {}
            : {
                simulationPhase: 'complete' as SimulationPhase,
                // Keep a background job untouched when opening a different chat.
                ...(s.loadingConversationId && s.loadingConversationId !== conversationId
                  ? {}
                  : {
                      loadingVersionId: null,
                      loadingConversationId: null,
                      triageOutcome: null,
                      pendingBaseScenarioId: null,
                      pendingScenarioId: null,
                    }),
              }),
        })
      },

      setForcedDemoMode: (mode) => set({ forcedDemoMode: mode }),

      shuffleCreditsUsage: () =>
        set((s) => {
          const usedPct = Math.floor(Math.random() * 101)
          return {
            creditsUsed: Math.round(s.creditsTotal * (usedPct / 100)),
          }
        }),

      resolveReuseReport: (action) => {
        const { activeVersionId, versions, pendingBaseScenarioId } = get()
        if (!activeVersionId || !pendingBaseScenarioId) return

        const version = versions.find((v) => v.id === activeVersionId)
        const baseScenario = scenarios.find((s) => s.id === pendingBaseScenarioId)
        if (!version || !baseScenario) return

        if (action === 'generate-new') {
          const updated = patchVersionFromScenario(version, baseScenario, version.question)
          set({
            versions: versions.map((v) => (v.id === activeVersionId ? updated : v)),
            simulationPhase: 'thinking',
            thinkingStep: SHARED_PREFIX_LENGTH,
            revealedCardCount: 0,
            triageOutcome: 'instant',
            pendingScenarioId: baseScenario.id,
            composerChips: null,
          })
          return
        }

        if (action === 'use') {
          const reused = applyReuseOverride(baseScenario)
          const updated = patchVersionFromScenario(version, reused, version.question)
          set({
            versions: versions.map((v) => (v.id === activeVersionId ? updated : v)),
            simulationPhase: 'complete',
            loadingVersionId: null,
            pendingScenarioId: null,
            triageOutcome: null,
            pendingBaseScenarioId: null,
            composerChips: chipsFromVersion(updated),
          })
          get().addToast('Using existing report.')
          return
        }
      },
    }),
    {
      name: 'parley-demo',
      partialize: (s) => ({
        favoritedReports: s.favoritedReports,
        conversations: s.conversations,
        creditsUsed: s.creditsUsed,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> & { versions?: Version[] }
        let favoritedReports = Array.isArray(p?.favoritedReports) ? p.favoritedReports : []
        let conversations = Array.isArray(p?.conversations) ? p.conversations : []

        // Fresh installs / empty demo state: seed the sidebar with sample chats.
        if (conversations.length === 0) {
          conversations = sampleConversations
        }
        if (favoritedReports.length === 0) {
          favoritedReports = sampleArtifacts
        }

        // Backfill newer sample artifacts (e.g. CSV demos) without wiping user saves.
        for (const sample of sampleArtifacts) {
          if (!favoritedReports.some((f) => f.id === sample.id)) {
            favoritedReports = [...favoritedReports, sample]
          }
        }
        for (const sampleConv of sampleConversations) {
          if (!conversations.some((c) => c.id === sampleConv.id)) {
            conversations = [...conversations, sampleConv]
          }
        }

        if (Array.isArray(p?.versions)) {
          for (const v of p.versions.filter((ver) => ver.favorited)) {
            if (!favoritedReports.some((f) => f.id === v.id)) {
              favoritedReports = [...favoritedReports, v]
            }
          }
        }

        for (const fav of favoritedReports) {
          // Library-only demo seeds (`sample-lib-*`) stay in Artifacts, not Recent.
          if (fav.id.startsWith('sample-lib-')) continue
          if (!conversations.some((c) => c.versions.some((v) => v.id === fav.id))) {
            conversations = [
              {
                id: `conv-${fav.id}`,
                title: fav.bookmarkName ?? fav.question,
                versions: [fav],
                createdAt: fav.createdAt,
                updatedAt: fav.createdAt,
                pinned: false,
              },
              ...conversations,
            ]
          }
        }

        conversations = compactPinOrders(conversations)

        return {
          ...current,
          creditsUsed: typeof p?.creditsUsed === 'number' ? p.creditsUsed : current.creditsUsed,
          favoritedReports,
          conversations,
          versions: [],
        }
      },
    },
  ),
)

export function useActiveVersion(): Version | null {
  return useAppStore(
    useShallow((s) => {
      if (!s.activeVersionId) return null
      return s.versions.find((v) => v.id === s.activeVersionId) ?? null
    }),
  )
}

export function useFavoritedVersions(): Version[] {
  return useAppStore(useShallow((s) => s.favoritedReports))
}

export function useIsLatestVersion(): boolean {
  return useAppStore((s) => {
    if (s.versions.length === 0) return true
    return s.versions[s.versions.length - 1].id === s.activeVersionId
  })
}

export function useIsVersionLoading(versionId: string): boolean {
  return useAppStore(
    (s) =>
      s.loadingVersionId === versionId &&
      s.simulationPhase !== 'complete' &&
      s.simulationPhase !== 'idle',
  )
}

export function useIsActiveVersionLoading(): boolean {
  return useAppStore((s) => {
    if (!s.loadingVersionId || !s.activeVersionId) return false
    return (
      s.loadingVersionId === s.activeVersionId &&
      s.simulationPhase !== 'complete' &&
      s.simulationPhase !== 'idle' &&
      s.simulationPhase !== 'triage-prompt'
    )
  })
}
