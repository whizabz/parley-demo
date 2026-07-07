export type TriageLane = 'instant' | 'background' | 'export'
export type DemoMode = TriageLane | 'reused'
export type ReportStatus = 'generating' | 'ready' | 'failed'
export type ReportOrigin = 'generated' | 'reused'

export interface DataSource {
  id: string
  name: string
  lastRefreshed: string
  domain: string
  permissionTags: string[]
  restricted?: boolean
}

export interface Domain {
  id: string
  name: string
  owningTeam: string
  permissionTags: string[]
}

export interface LineageNode {
  id: string
  label: string
  children?: LineageNode[]
}

export interface NarrativeSegment {
  text: string
  type: 'fact' | 'interpretation'
}

export interface BaseCard {
  id: string
  title: string
  sources: string[]
  generationDetail: string
  queryLogic: string
  lineage: LineageNode[]
  contextualFollowUpChips: string[]
}

export interface ChartCard extends BaseCard {
  type: 'chart'
  chartType: 'line' | 'bar'
  data: { label: string; value: number; value2?: number }[]
  yLabel?: string
}

export interface MetricCard extends BaseCard {
  type: 'metric'
  value: string
  change?: string
  changeDirection?: 'up' | 'down' | 'neutral'
  subtitle?: string
}

export interface TableCard extends BaseCard {
  type: 'table'
  columns: string[]
  rows: string[][]
}

export interface InsightCard extends BaseCard {
  type: 'insight'
  body: string
}

export type Card = ChartCard | MetricCard | TableCard | InsightCard

export interface OriginalReportRef {
  id: string
  question: string
  createdBy: string
  createdAt: string
}

export interface Report {
  id: string
  question: string
  domain: string
  triageLane: TriageLane
  status: ReportStatus
  origin: ReportOrigin
  originalReportRef?: OriginalReportRef
  cards: Card[]
  exportFileName?: string
  exportFileSize?: string
}

export type ResponseKind = 'text' | 'report'

export interface Version {
  id: string
  question: string
  summary: string
  report: Report
  narrative: NarrativeSegment[]
  refinementChips: string[]
  responseKind: ResponseKind
  createdAt: string
  favorited: boolean
  bookmarkName?: string
}

export interface Scenario {
  id: string
  matchPatterns: string[]
  question: string
  summary: string
  description?: string
  triageLane: TriageLane
  origin: ReportOrigin
  domain: string
  narrative: NarrativeSegment[]
  refinementChips: string[]
  cards: Card[]
  originalReportRef?: OriginalReportRef
  exportFileName?: string
  exportFileSize?: string
}

export interface SuggestedPrompt {
  id: string
  title: string
  description: string
  question: string
}

export type View = 'home' | 'workspace'

export type SimulationPhase =
  | 'idle'
  | 'discovering'
  | 'triage-prompt'
  | 'thinking'
  | 'revealing'
  | 'background-wait'
  | 'complete'

export type TriageOutcome = 'text' | 'reuse' | 'instant' | 'background' | 'export'

export type PipelineStepVariant = 'default' | 'alert'

export interface PipelineStep {
  text: string
  variant?: PipelineStepVariant
}

export interface Toast {
  id: string
  message: string
}

export interface Conversation {
  id: string
  title: string
  versions: Version[]
  createdAt: string
  updatedAt: string
  pinned: boolean
}
