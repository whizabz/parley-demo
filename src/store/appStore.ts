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
import { syncConversationPin, upsertConversation } from '../utils/conversations'
import { suggestBookmarkName } from '../utils/suggestBookmarkName'

const CREDIT_COSTS = { instant: 1, background: 3, export: 2 } as const

interface AppState {
  view: View
  versions: Version[]
  activeVersionId: string | null
  selectedCardId: string | null
  contextualFollowUpChips: string[] | null
  simulationPhase: SimulationPhase
  thinkingStep: number
  revealedCardCount: number
  pendingScenarioId: string | null
  loadingVersionId: string | null
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
  pinConversation: (conversationId: string) => void
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
}

function makeVersion(
  question: string,
  scenario: NonNullable<ReturnType<typeof findScenario>>,
  responseKind: ResponseKind = 'report',
): Version {
  const report = scenarioToReport(scenario)
  if (responseKind === 'text') {
    report.cards = []
  }
  return {
    id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    question,
    summary: scenario.summary,
    report,
    narrative: scenario.narrative,
    refinementChips: scenario.refinementChips,
    responseKind,
    createdAt: new Date().toISOString(),
    favorited: false,
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
  const responseKind: ResponseKind = triageOutcome === 'text' ? 'text' : 'report'
  const cost =
    responseKind === 'text'
      ? 0
      : CREDIT_COSTS[
          scenario.triageLane === 'export'
            ? 'export'
            : scenario.triageLane === 'background'
              ? 'background'
              : 'instant'
        ]
  const version = makeVersion(question, scenario, responseKind)

  return {
    view: 'workspace' as const,
    versions: freshSession ? [version] : [...existingVersions, version],
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
    creditsUsed: Math.min(creditsUsed + cost, creditsTotal),
    canvasOpen: false,
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: 'home',
      versions: [],
      activeVersionId: null,
      selectedCardId: null,
      contextualFollowUpChips: null,
      simulationPhase: 'idle',
      thinkingStep: 0,
      revealedCardCount: 0,
      pendingScenarioId: null,
      loadingVersionId: null,
      creditsUsed: 38,
      creditsTotal: 100,
      creditsResetAt: new Date(Date.now() + (2 * 60 + 47) * 60 * 1000).toISOString(),
      toasts: [],
      validationOpen: false,
      favoritedReports: [],
      conversations: [],
      activeConversationId: null,
      forcedDemoMode: null,
      triageOutcome: null,
      pendingBaseScenarioId: null,
      bookmarkPromptVersionId: null,
      autoOutcomeIndex: 0,
      canvasOpen: false,

      goHome: () =>
        set({
          view: 'home',
          simulationPhase: 'idle',
          selectedCardId: null,
          contextualFollowUpChips: null,
          triageOutcome: null,
          pendingBaseScenarioId: null,
          activeConversationId: null,
          canvasOpen: false,
        }),

      startNewChat: () =>
        set({
          view: 'home',
          versions: [],
          activeVersionId: null,
          activeConversationId: null,
          simulationPhase: 'idle',
          selectedCardId: null,
          contextualFollowUpChips: null,
          triageOutcome: null,
          pendingBaseScenarioId: null,
          loadingVersionId: null,
          canvasOpen: false,
        }),

      openCanvas: () => set({ canvasOpen: true }),

      closeCanvas: () =>
        set({ canvasOpen: false, selectedCardId: null, contextualFollowUpChips: null }),

      openWorkspace: () => set({ view: 'workspace' }),

      startNewQuestion: (question: string) => {
        const base = resolveScenario(question)
        const { forcedDemoMode, autoOutcomeIndex } = get()
        const outcome = resolveTriageOutcome(base, forcedDemoMode, autoOutcomeIndex)
        const scenario = scenarioForOutcome(base, outcome)
        const nextAutoOutcomeIndex =
          forcedDemoMode === null
            ? (autoOutcomeIndex + 1) % AUTO_TRIAGE_OUTCOME_ORDER.length
            : autoOutcomeIndex
        const conversationId = `conv-${Date.now()}`
        set((s) => ({
          ...applyQuestion(question, scenario, outcome, base.id, s.creditsUsed, s.creditsTotal, true, s.versions),
          autoOutcomeIndex: nextAutoOutcomeIndex,
          activeConversationId: conversationId,
        }))
      },

      submitQuestion: (question: string) => {
        const base = resolveScenario(question)
        const { forcedDemoMode, autoOutcomeIndex } = get()
        const outcome = resolveTriageOutcome(base, forcedDemoMode, autoOutcomeIndex)
        const scenario = scenarioForOutcome(base, outcome)
        const nextAutoOutcomeIndex =
          forcedDemoMode === null
            ? (autoOutcomeIndex + 1) % AUTO_TRIAGE_OUTCOME_ORDER.length
            : autoOutcomeIndex
        set((s) => ({
          ...applyQuestion(question, scenario, outcome, base.id, s.creditsUsed, s.creditsTotal, false, s.versions),
          autoOutcomeIndex: nextAutoOutcomeIndex,
          activeConversationId: s.activeConversationId ?? `conv-${Date.now()}`,
        }))
      },

      setActiveVersion: (id: string) =>
        set({
          activeVersionId: id,
          selectedCardId: null,
          contextualFollowUpChips: null,
        }),

      goToLatest: () => {
        const { versions } = get()
        if (versions.length === 0) return
        set({
          activeVersionId: versions[versions.length - 1].id,
          selectedCardId: null,
          contextualFollowUpChips: null,
        })
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
          ...favoritedReports.filter((f) => f.id !== bookmarkPromptVersionId),
          updated,
        ]
        const nextConversations = activeConversationId
          ? syncConversationPin(
              upsertConversation(conversations, activeConversationId, nextVersions),
              activeConversationId,
              nextVersions,
            )
          : conversations

        set({
          versions: nextVersions,
          favoritedReports: nextFavorited,
          conversations: nextConversations,
          bookmarkPromptVersionId: null,
        })
        get().addToast('Report bookmarked.')
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
          const conversations = s.conversations.map((c) => {
            const nextVersions = c.versions.map((v) => (v.id === versionId ? updated : v))
            return {
              ...c,
              versions: nextVersions,
              pinned: nextVersions.some((v) => v.favorited),
            }
          })

          return { versions, favoritedReports, conversations }
        }),

      pinConversation: (conversationId: string) =>
        set((s) => {
          const conversation = s.conversations.find((c) => c.id === conversationId)
          if (!conversation || conversation.versions.length === 0) return s

          const version = conversation.versions[conversation.versions.length - 1]
          if (version.favorited) return s

          const updated = {
            ...version,
            favorited: true,
            bookmarkName: suggestBookmarkName(version.question, version.summary),
          }

          const conversations = s.conversations.map((c) => {
            if (c.id !== conversationId) return c
            const nextVersions = c.versions.map((v) => (v.id === version.id ? updated : v))
            return { ...c, versions: nextVersions, pinned: true }
          })

          const favoritedReports = [
            ...s.favoritedReports.filter((f) => f.id !== version.id),
            updated,
          ]

          const versions =
            s.activeConversationId === conversationId
              ? s.versions.map((v) => (v.id === version.id ? updated : v))
              : s.versions

          return { conversations, favoritedReports, versions }
        }),

      selectCard: (cardId: string, chips: string[]) =>
        set({ selectedCardId: cardId, contextualFollowUpChips: chips }),

      clearCardSelection: () => set({ selectedCardId: null, contextualFollowUpChips: null }),

      setSimulationPhase: (phase) => set({ simulationPhase: phase }),

      setThinkingStep: (step) => set({ thinkingStep: step }),

      incrementRevealedCards: () =>
        set((s) => ({ revealedCardCount: s.revealedCardCount + 1 })),

      completeSimulation: () =>
        set((s) => {
          const conversations =
            s.activeConversationId && s.versions.length > 0
              ? upsertConversation(s.conversations, s.activeConversationId, s.versions)
              : s.conversations
          return {
            simulationPhase: 'complete',
            pendingScenarioId: null,
            loadingVersionId: null,
            triageOutcome: null,
            pendingBaseScenarioId: null,
            conversations,
          }
        }),

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
          canvasOpen: false,
        })
      },

      loadConversation: (conversationId: string) => {
        const conversation = get().conversations.find((c) => c.id === conversationId)
        if (!conversation || conversation.versions.length === 0) return

        const activeVersion = conversation.versions[conversation.versions.length - 1]

        set({
          view: 'workspace',
          versions: conversation.versions,
          activeVersionId: activeVersion.id,
          activeConversationId: conversationId,
          simulationPhase: 'complete',
          loadingVersionId: null,
          selectedCardId: null,
          contextualFollowUpChips: null,
          canvasOpen: false,
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

        if (Array.isArray(p?.versions)) {
          for (const v of p.versions.filter((ver) => ver.favorited)) {
            if (!favoritedReports.some((f) => f.id === v.id)) {
              favoritedReports = [...favoritedReports, v]
            }
          }
        }

        for (const fav of favoritedReports) {
          if (!conversations.some((c) => c.versions.some((v) => v.id === fav.id))) {
            conversations = [
              {
                id: `conv-${fav.id}`,
                title: fav.bookmarkName ?? fav.question,
                versions: [fav],
                createdAt: fav.createdAt,
                updatedAt: fav.createdAt,
                pinned: true,
              },
              ...conversations,
            ]
          }
        }

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
