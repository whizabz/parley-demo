import type { SuggestedPrompt } from '../types'

export const suggestedPrompts: SuggestedPrompt[] = [
  {
    id: 'loss-ratio',
    title: "What's our loss ratio trend this year?",
    description: 'Track incurred losses against earned premium over time.',
    question: "What's our loss ratio trend this year?",
  },
  {
    id: 'clarify-claims-scope',
    title: 'Can you analyze our claims performance?',
    description: 'Asks clarifying questions with A–D options before answering.',
    question: 'Can you analyze our claims performance?',
  },
  {
    id: 'claims-region',
    title: 'How do claims by region compare to last year?',
    description: 'Regional volume and year-over-year change across markets.',
    question: 'How do claims by region compare to last year?',
  },
  {
    id: 'claims-volume-reuse',
    title: 'Show claims volume by region',
    description: 'Regional breakdown of open and closed claims.',
    question: 'Show claims volume by region',
  },
  {
    id: 'retention-cohort',
    title: 'Run a full retention cohort analysis',
    description: 'Cohort survival across the full policy population.',
    question: 'Run a full retention cohort analysis across all policies',
  },
  {
    id: 'export-claims',
    title: 'Pull five years of claim line items',
    description: 'Raw export for very large historical pulls.',
    question: 'Pull every claim line item for the last five years',
  },
  {
    id: 'premium-retention',
    title: 'Which segments have the lowest retention?',
    description: 'Identify cohorts with elevated lapse risk.',
    question: 'Which member segments have the lowest retention?',
  },
  {
    id: 'severity-q2',
    title: "What's driving claim severity in Q2?",
    description: 'Severity trends and large-loss contributors.',
    question: "What's driving the increase in claim severity in Q2?",
  },
  {
    id: 'med-pharm-trend',
    title: 'Compare medical vs pharmacy trend',
    description: 'Cost trend split by line of business.',
    question: 'Compare medical vs pharmacy trend by line of business',
  },
  {
    id: 'open-claims-aging',
    title: 'Show open claims aging over 90 days',
    description: 'Aged inventory by adjuster and region.',
    question: 'Show open claims aging over 90 days by adjuster',
  },
  {
    id: 'combined-ratio-state',
    title: 'Combined ratio by state for commercial auto',
    description: 'State-level loss and expense performance.',
    question: 'What is our combined ratio by state for commercial auto?',
  },
  {
    id: 'prior-auth-volume',
    title: 'How has prior auth volume changed?',
    description: 'Month-over-month authorization request trends.',
    question: 'How has prior authorization volume changed month over month?',
  },
  {
    id: 'provider-denials',
    title: 'Which providers have the highest denial rates?',
    description: 'Denial concentration across the provider network.',
    question: 'Which providers have the highest denial rates?',
  },
  {
    id: 'cat-losses',
    title: 'Break down losses by catastrophe event',
    description: 'Incurred loss attribution to named CAT events.',
    question: 'Break down incurred losses by catastrophe event',
  },
  {
    id: 'premium-membership',
    title: 'Premium growth vs membership growth',
    description: 'Compare growth rates by market.',
    question: 'Show premium growth vs membership growth by market',
  },
  {
    id: 'renewal-uplift',
    title: 'How many policies renewed at a higher premium?',
    description: 'Renewal pricing outcomes across the book.',
    question: 'What percentage of policies renewed at a higher premium?',
  },
  {
    id: 'inpatient-outpatient',
    title: 'Inpatient vs outpatient cost per member',
    description: 'Utilization mix and unit cost comparison.',
    question: 'Compare inpatient vs outpatient cost per member',
  },
  {
    id: 'auth-appeals',
    title: 'Where are prior-auth appeals most common?',
    description: 'Appeal volume by service category and region.',
    question: 'Where are we seeing the most prior-auth appeals?',
  },
  {
    id: 'stop-loss',
    title: 'Stop-loss utilization for large group accounts',
    description: 'Attachment point breaches and large-claim activity.',
    question: 'Show stop-loss utilization for large group accounts',
  },
]

/** Curated starters for the home empty state (demo-friendly mix of answers/reports). */
const HOME_STARTER_IDS = [
  'loss-ratio',
  'clarify-claims-scope',
  'claims-volume-reuse',
  'export-claims',
  'retention-cohort',
  'claims-region',
  'premium-retention',
  'severity-q2',
] as const

export const homeStarterPrompts: SuggestedPrompt[] = HOME_STARTER_IDS.map((id) => {
  const prompt = suggestedPrompts.find((p) => p.id === id)
  if (!prompt) throw new Error(`Missing starter prompt: ${id}`)
  return prompt
})

/** Placeholders rotate through these when the home input is idle (typed as real questions). */
export const homePlaceholderExamples = [
  "What's our loss ratio trend this year?",
  'Can you analyze our claims performance?',
  'How do claims by region compare to last year?',
  'Show claims volume by region',
  'Pull every claim line item for the last five years',
]

export function filterHomePrompts(query: string, limit = 5): SuggestedPrompt[] {
  const q = query.trim().toLowerCase()
  if (!q) return homeStarterPrompts.slice(0, limit)

  const ranked = suggestedPrompts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.question.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  )
  return ranked.slice(0, limit)
}
