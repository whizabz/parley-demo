import type { Card, DemoMode, Scenario, TriageLane } from '../types'

const lossRatioLineChart: Card = {
  id: 'loss-ratio-chart',
  type: 'chart',
  chartType: 'line',
  title: 'Loss Ratio — YTD Trend',
  yLabel: 'Loss ratio %',
  data: [
    { label: 'Jan', value: 68.2 },
    { label: 'Feb', value: 69.1 },
    { label: 'Mar', value: 71.4 },
    { label: 'Apr', value: 70.8 },
    { label: 'May', value: 72.3 },
    { label: 'Jun', value: 71.9 },
  ],
  sources: ['Claims Ledger', 'Premium Register'],
  generationDetail:
    'Calculated incurred losses divided by earned premium, aggregated monthly for calendar year 2026. Excludes IBNR adjustments.',
  queryLogic: `WITH monthly_losses AS (
  SELECT
    DATE_TRUNC('month', c.loss_date) AS month,
    SUM(c.incurred_loss) AS incurred,
    SUM(p.earned_premium) AS earned
  FROM claims_ledger c
  JOIN premium_register p ON c.policy_id = p.policy_id
  WHERE c.loss_date >= '2026-01-01'
    AND p.earned_premium > 0
  GROUP BY 1
)
SELECT
  month,
  incurred,
  earned,
  ROUND(incurred / NULLIF(earned, 0) * 100, 1) AS loss_ratio
FROM monthly_losses
ORDER BY month`,
  lineage: [
    { id: 'l1', label: 'Claims Ledger', children: [{ id: 'l1a', label: 'Core EDW' }] },
    { id: 'l2', label: 'Premium Register', children: [{ id: 'l2a', label: 'Billing System' }] },
  ],
  contextualFollowUpChips: ["Break down by line of business","Filter to commercial lines","Show severity overlay"],
}

const lossRatioMetric: Card = {
  id: 'loss-ratio-metric',
  type: 'metric',
  title: 'Current Loss Ratio',
  value: '71.9%',
  change: '+2.1 pts vs prior month',
  changeDirection: 'up',
  subtitle: 'June 2026',
  sources: ['Claims Ledger', 'Premium Register'],
  generationDetail: 'Point-in-time loss ratio for the most recent closed month.',
  queryLogic: `SELECT SUM(incurred_loss) / NULLIF(SUM(earned_premium), 0) * 100
FROM claims_ledger WHERE loss_date >= '2026-06-01' AND loss_date < '2026-07-01'`,
  lineage: [{ id: 'l1', label: 'Claims Ledger' }],
  contextualFollowUpChips: ["Compare to same month last year","Show YoY change","Add prior year overlay"],
}

const lossRatioInsight: Card = {
  id: 'loss-ratio-insight',
  type: 'insight',
  title: 'Key Observation',
  body: 'The March spike aligns with elevated catastrophe claims in the Southeast region. Severity-driven losses appear to be the primary driver rather than frequency.',
  sources: ['Claims Ledger', 'Adjuster Notes'],
  generationDetail: 'Synthesized from trend data and adjuster severity flags in affected regions.',
  queryLogic: '-- Narrative synthesis from trend + severity flags',
  lineage: [{ id: 'l1', label: 'Claims Ledger' }, { id: 'l2', label: 'Adjuster Notes' }],
  contextualFollowUpChips: ["Show Southeast CAT claims","Break down by claim type","Add severity details"],
}

const lossRatioTable: Card = {
  id: 'loss-ratio-table',
  type: 'table',
  title: 'Monthly Summary',
  columns: ['Month', 'Incurred ($M)', 'Earned Premium ($M)', 'Ratio'],
  rows: [
    ['Jan', '142.3', '208.7', '68.2%'],
    ['Feb', '148.1', '214.2', '69.1%'],
    ['Mar', '161.8', '226.4', '71.4%'],
    ['Apr', '156.2', '220.8', '70.8%'],
    ['May', '164.5', '227.5', '72.3%'],
    ['Jun', '162.9', '226.6', '71.9%'],
  ],
  sources: ['Claims Ledger', 'Premium Register'],
  generationDetail: 'Underlying monthly figures behind the loss ratio trend.',
  queryLogic: 'SELECT month, incurred, earned, ratio FROM loss_ratio_monthly',
  lineage: [{ id: 'l1', label: 'Claims Ledger' }],
  contextualFollowUpChips: ["Filter to commercial lines","Export this table","Add prior month column"],
}

const regionBarChart: Card = {
  id: 'region-bar-chart',
  type: 'chart',
  chartType: 'bar',
  title: 'Claims Volume by Region — YoY',
  yLabel: 'Claim count',
  data: [
    { label: 'Northeast', value: 12400, value2: 11800 },
    { label: 'Southeast', value: 18200, value2: 15100 },
    { label: 'Midwest', value: 9800, value2: 10200 },
    { label: 'West', value: 14600, value2: 13900 },
    { label: 'Southwest', value: 11200, value2: 10800 },
  ],
  sources: ['Claims Ledger'],
  generationDetail:
    'Claim counts by region for H1 2026 vs H1 2025. Bars show current year (solid) and prior year (outline).',
  queryLogic: `WITH regional_claims AS (
  SELECT
    c.region,
    c.claim_id,
    c.claim_date,
    c.claim_status,
    c.incurred_loss
  FROM claims_ledger c
  WHERE c.claim_date BETWEEN '2026-01-01' AND '2026-06-30'
    AND c.claim_status IN ('open', 'closed', 'paid')
),
prior_year AS (
  SELECT
    region,
    COUNT(*) AS prior_count
  FROM claims_ledger
  WHERE claim_date BETWEEN '2025-01-01' AND '2025-06-30'
  GROUP BY region
)
SELECT
  rc.region,
  COUNT(DISTINCT rc.claim_id) AS claim_count,
  SUM(rc.incurred_loss) AS total_incurred,
  py.prior_count,
  ROUND(
    (COUNT(DISTINCT rc.claim_id) - py.prior_count)::numeric
    / NULLIF(py.prior_count, 0) * 100,
    1
  ) AS yoy_change_pct
FROM regional_claims rc
LEFT JOIN prior_year py ON py.region = rc.region
GROUP BY rc.region, py.prior_count
ORDER BY claim_count DESC`,
  lineage: [{ id: 'l1', label: 'Claims Ledger' }],
  contextualFollowUpChips: ["Drill into Southeast","Show by claim type","Add severity overlay"],
}

const regionMetric1: Card = {
  id: 'region-metric-se',
  type: 'metric',
  title: 'Southeast YoY Change',
  value: '+20.5%',
  change: 'Largest regional increase',
  changeDirection: 'up',
  sources: ['Claims Ledger'],
  generationDetail: 'Year-over-year change in claim count for the Southeast region.',
  queryLogic: 'SELECT region, yoy_change FROM regional_claims_yoy WHERE region = \'Southeast\'',
  lineage: [{ id: 'l1', label: 'Claims Ledger' }],
  contextualFollowUpChips: ["Southeast claim types","Show CAT-related claims","Compare to other regions"],
}

const regionMetric2: Card = {
  id: 'region-metric-total',
  type: 'metric',
  title: 'Total Claims H1',
  value: '66.2K',
  change: '+8.3% vs H1 2025',
  changeDirection: 'up',
  sources: ['Claims Ledger'],
  generationDetail: 'Total claim count across all regions for the first half of 2026.',
  queryLogic: 'SELECT COUNT(*) FROM claims_ledger WHERE claim_date >= \'2026-01-01\'',
  lineage: [{ id: 'l1', label: 'Claims Ledger' }],
  contextualFollowUpChips: ["Break down by claim status","Show open vs closed","Filter to paid claims"],
}

const regionInsight: Card = {
  id: 'region-insight',
  type: 'insight',
  title: 'Regional Drivers',
  body: 'Southeast volume growth coincides with two CAT events in Q1. Midwest decline likely reflects milder winter weather compared to the prior year.',
  sources: ['Claims Ledger', 'Adjuster Notes'],
  generationDetail: 'Cross-referenced regional trends with catastrophe event registry.',
  queryLogic: '-- Regional trend + CAT event correlation',
  lineage: [{ id: 'l1', label: 'Claims Ledger' }],
  contextualFollowUpChips: ["CAT impact by month","List CAT events","Show affected regions"],
}

export const reuseCards: Card[] = [
  {
    id: 'reuse-region-chart',
    type: 'chart',
    chartType: 'bar',
    title: 'Claims Volume by Region',
    yLabel: 'Open + closed claims',
    data: [
      { label: 'Northeast', value: 8400 },
      { label: 'Southeast', value: 12300 },
      { label: 'Midwest', value: 6200 },
      { label: 'West', value: 9800 },
      { label: 'Southwest', value: 7100 },
    ],
    sources: ['Claims Ledger'],
    generationDetail: 'Regional claim counts for the current reporting period.',
    queryLogic: 'SELECT region, COUNT(*) FROM claims_ledger GROUP BY region',
    lineage: [{ id: 'l1', label: 'Claims Ledger' }],
    contextualFollowUpChips: ["Open claims only","Show closed claims","Compare open vs closed"],
  },
  {
    id: 'reuse-region-metric',
    type: 'metric',
    title: 'Highest Volume Region',
    value: 'Southeast',
    subtitle: '12,300 claims',
    sources: ['Claims Ledger'],
    generationDetail: 'Region with the highest total claim count.',
    queryLogic: 'SELECT region, COUNT(*) AS cnt FROM claims_ledger GROUP BY 1 ORDER BY 2 DESC LIMIT 1',
    lineage: [{ id: 'l1', label: 'Claims Ledger' }],
    contextualFollowUpChips: ["Average severity in Southeast","Highest severity claims","Compare regional severity"],
  },
  {
    id: 'reuse-region-insight',
    type: 'insight',
    title: 'Distribution Note',
    body: 'Southeast and West together account for 54% of total claim volume. Concentration is consistent with membership distribution in those markets.',
    sources: ['Claims Ledger', 'Policy Master'],
    generationDetail: 'Volume share analysis weighted against enrolled membership by region.',
    queryLogic: '-- Regional volume vs membership share',
    lineage: [{ id: 'l1', label: 'Claims Ledger' }, { id: 'l2', label: 'Policy Master' }],
    contextualFollowUpChips: ["Volume vs premium share","Show premium by region","Add membership overlay"],
  },
]

const retentionCards: Card[] = [
  {
    id: 'retention-chart',
    type: 'chart',
    chartType: 'line',
    title: 'Retention Rate by Cohort',
    yLabel: 'Retention %',
    data: [
      { label: 'M0', value: 100 },
      { label: 'M3', value: 94.2 },
      { label: 'M6', value: 89.1 },
      { label: 'M9', value: 85.6 },
      { label: 'M12', value: 82.3 },
    ],
    sources: ['Policy Master', 'Premium Register'],
    generationDetail: '12-month retention curve for policies issued in H2 2025.',
    queryLogic: 'SELECT cohort_month, retention_rate FROM retention_cohort_analysis',
    lineage: [{ id: 'l1', label: 'Policy Master' }],
    contextualFollowUpChips: ["Split by product tier","Show by plan type","Compare tiers"],
  },
  {
    id: 'retention-metric',
    type: 'metric',
    title: '12-Month Retention',
    value: '82.3%',
    change: '-1.8 pts vs prior cohort',
    changeDirection: 'down',
    sources: ['Policy Master'],
    generationDetail: 'Retention at month 12 for the most recent complete cohort.',
    queryLogic: 'SELECT retention_12m FROM cohort_summary ORDER BY cohort DESC LIMIT 1',
    lineage: [{ id: 'l1', label: 'Policy Master' }],
    contextualFollowUpChips: ["Segment driving decline","Show lapse reasons","Compare cohorts"],
  },
  {
    id: 'retention-insight',
    type: 'insight',
    title: 'Cohort Analysis',
    body: 'Early lapse concentration appears in months 3–6, which lines up with the first renewal period. Worth checking whether pricing changes at renewal coincide with the drop-off.',
    sources: ['Policy Master', 'Premium Register'],
    generationDetail: 'Cohort survival analysis with renewal event overlay.',
    queryLogic: '-- Cohort survival + renewal event join',
    lineage: [{ id: 'l1', label: 'Policy Master' }],
    contextualFollowUpChips: ["Lapse reasons M3–M6","Renewal period analysis","Show pricing changes"],
  },
]

const monthlyBreakdownChart: Card = {
  id: 'monthly-breakdown',
  type: 'chart',
  chartType: 'line',
  title: 'Loss Ratio — Monthly Breakdown',
  yLabel: 'Loss ratio %',
  data: [
    { label: 'Wk 1', value: 70.1 },
    { label: 'Wk 2', value: 71.8 },
    { label: 'Wk 3', value: 72.4 },
    { label: 'Wk 4', value: 71.2 },
  ],
  sources: ['Claims Ledger'],
  generationDetail: 'Weekly loss ratio within the most recent month.',
  queryLogic: 'SELECT week, loss_ratio FROM weekly_loss_ratio WHERE month = CURRENT_MONTH',
  lineage: [{ id: 'l1', label: 'Claims Ledger' }],
  contextualFollowUpChips: ["Highest severity week","Show week 3 claims","Compare weekly severity"],
}

export const scenarios: Scenario[] = [
  {
    id: 'loss-ratio',
    summary: 'YTD loss ratio at 71.9%, trending up since January',
    matchPatterns: ['loss ratio', 'loss-ratio'],
    question: "What's our loss ratio trend this year?",
    triageLane: 'instant',
    origin: 'generated',
    domain: 'claims',
    narrative: [
      { text: 'Your year-to-date loss ratio stands at 71.9% as of June.', type: 'fact' },
      { text: 'The ratio has climbed roughly 3.7 points since January, with a notable spike in March.', type: 'fact' },
      {
        text: 'The March movement coincides with elevated catastrophe activity in the Southeast — likely related to severity rather than claim frequency.',
        type: 'interpretation',
      },
    ],
    refinementChips: ['Break down monthly', 'Filter by region', 'Compare to last year', 'Show by line of business'],
    cards: [lossRatioLineChart, lossRatioMetric, lossRatioInsight, lossRatioTable],
  },
  {
    id: 'claims-region',
    summary: 'H1 claims up 8.3% YoY — Southeast leads growth',
    matchPatterns: ['claims by region', 'region compare', 'compare to last year'],
    question: 'How do claims by region compare to last year?',
    triageLane: 'instant',
    origin: 'generated',
    domain: 'claims',
    narrative: [
      { text: 'Total H1 claim volume is 66.2K, up 8.3% year over year.', type: 'fact' },
      { text: 'The Southeast leads all regions with 18.2K claims — a 20.5% increase over H1 2025.', type: 'fact' },
      {
        text: 'The Southeast surge lines up with two Q1 catastrophe events. Midwest volume dipped slightly, which the timing suggests may reflect milder winter conditions.',
        type: 'interpretation',
      },
    ],
    refinementChips: ['Drill into Southeast', 'Show by claim type', 'Add severity overlay'],
    cards: [regionBarChart, regionMetric1, regionMetric2, regionInsight],
  },
  {
    id: 'claims-volume-reuse',
    summary: 'Matched existing regional claims volume report',
    matchPatterns: ['claims volume by region', 'volume by region', 'show claims volume'],
    question: 'Show claims volume by region',
    triageLane: 'instant',
    origin: 'reused',
    domain: 'claims',
    originalReportRef: {
      id: 'lib-report-001',
      question: 'Show claims volume by region',
      createdBy: 'Sarah Chen',
      createdAt: '2026-05-14T10:30:00Z',
    },
    narrative: [
      {
        text: 'The regional distribution has been stable since this report was last run. Southeast and West remain the highest-volume markets.',
        type: 'interpretation',
      },
    ],
    refinementChips: ['Refresh with latest data', 'Filter to open claims', 'Add YoY comparison'],
    cards: reuseCards,
  },
  {
    id: 'retention-cohort',
    summary: 'Full-policy retention cohort analysis',
    matchPatterns: ['retention cohort', 'cohort analysis', 'full retention'],
    question: 'Run a full retention cohort analysis across all policies',
    triageLane: 'background',
    origin: 'generated',
    domain: 'policy',
    narrative: [
      { text: '12-month retention for the H2 2025 cohort finished at 82.3%, down 1.8 points versus the prior cohort.', type: 'fact' },
      { text: 'The steepest decline occurs between months 3 and 6, aligning with the first renewal window.', type: 'fact' },
      {
        text: 'Early lapse concentration at renewal suggests pricing or competitive pressure may be driving the drop-off.',
        type: 'interpretation',
      },
    ],
    refinementChips: ['Notify me when ready', 'Limit to commercial lines'],
    cards: retentionCards,
  },
  {
    id: 'export-claims',
    summary: 'Five-year claim line item export',
    matchPatterns: ['every claim line item', 'last five years', 'pull every claim', 'export all claims'],
    question: 'Pull every claim line item for the last five years',
    triageLane: 'export',
    origin: 'generated',
    domain: 'claims',
    narrative: [
      { text: 'The export contains 4.2M claim line items spanning January 2019 through June 2024.', type: 'fact' },
      { text: 'Paid claims account for 78% of rows; the remainder are open or denied statuses.', type: 'fact' },
      {
        text: 'Southeast region represents the largest share of incurred losses in the file.',
        type: 'interpretation',
      },
    ],
    refinementChips: ['Filter to paid claims only', 'Limit to one region', 'Include adjuster notes'],
    cards: [],
    exportFileName: 'claims_line_items_2019-2024.csv',
    exportFileSize: '2.4 MB',
  },
  {
    id: 'monthly-breakdown',
    summary: 'Weekly loss ratio breakdown for June',
    matchPatterns: ['break down monthly', 'monthly breakdown'],
    question: 'Break down the loss ratio monthly',
    triageLane: 'instant',
    origin: 'generated',
    domain: 'claims',
    narrative: [
      { text: 'Within June, the loss ratio ranged from 70.1% to 72.4% across four weekly periods.', type: 'fact' },
      {
        text: 'Week 3 peaked at 72.4%, which coincides with a batch of large commercial property claims closing that week.',
        type: 'interpretation',
      },
    ],
    refinementChips: ['Show claim details for week 3', 'Compare to May weekly', 'Filter by line of business'],
    cards: [monthlyBreakdownChart, lossRatioMetric, lossRatioInsight],
  },
  {
    id: 'clarify-claims-scope',
    summary: 'Need a bit more scope before building the analysis',
    matchPatterns: [
      'analyze our claims performance',
      'claims performance',
      'look into claims',
      'analyze claims',
    ],
    question: 'Can you analyze our claims performance?',
    triageLane: 'instant',
    origin: 'generated',
    domain: 'claims',
    narrative: [
      {
        text: 'I can dig into claims performance — a few choices would change the analysis materially. Which scope should I use?',
        type: 'interpretation',
      },
    ],
    refinementChips: [],
    cards: [],
    clarificationOptions: [
      {
        id: 'A',
        label: 'Loss ratio trend for the current year',
        submitQuestion: "What's our loss ratio trend this year?",
      },
      {
        id: 'B',
        label: 'Regional claims volume vs last year',
        submitQuestion: 'How do claims by region compare to last year?',
      },
      {
        id: 'C',
        label: 'Retention by member segment',
        submitQuestion: 'Which member segments have the lowest retention?',
      },
      {
        id: 'D',
        label: '',
        allowsCustom: true,
      },
    ],
  },
  {
    id: 'premium-retention',
    summary: 'Retention by segment — ACA lowest at 74.2%',
    matchPatterns: ['lowest retention', 'member segments', 'retention'],
    question: 'Which member segments have the lowest retention?',
    triageLane: 'instant',
    origin: 'generated',
    domain: 'policy',
    narrative: [
      { text: 'Individual ACA plans show the lowest 12-month retention at 74.2%.', type: 'fact' },
      { text: 'Small group commercial retention is 88.7%, while large group holds at 93.1%.', type: 'fact' },
      {
        text: 'The ACA segment dip aligns with the mid-year enrollment window — worth checking whether competitor pricing shifted during that period.',
        type: 'interpretation',
      },
    ],
    refinementChips: ['Show ACA trend over time', 'Compare by state', 'Add lapse reasons'],
    cards: [
      {
        id: 'segment-bar',
        type: 'chart',
        chartType: 'bar',
        title: 'Retention by Segment',
        yLabel: '12-mo retention %',
        data: [
          { label: 'ACA Individual', value: 74.2 },
          { label: 'Small Group', value: 88.7 },
          { label: 'Large Group', value: 93.1 },
          { label: 'Medicare Adv.', value: 91.4 },
        ],
        sources: ['Policy Master'],
        generationDetail: '12-month retention rate by product segment.',
        queryLogic: 'SELECT segment, retention_12m FROM segment_retention',
        lineage: [{ id: 'l1', label: 'Policy Master' }],
        contextualFollowUpChips: ["ACA by state","Top lapse states","Compare state retention"],
      },
      {
        id: 'segment-metric',
        type: 'metric',
        title: 'Lowest Retention',
        value: '74.2%',
        subtitle: 'ACA Individual',
        change: '-3.1 pts YoY',
        changeDirection: 'down',
        sources: ['Policy Master'],
        generationDetail: 'Segment with the lowest trailing 12-month retention.',
        queryLogic: 'SELECT segment, retention FROM segment_retention ORDER BY retention LIMIT 1',
        lineage: [{ id: 'l1', label: 'Policy Master' }],
        contextualFollowUpChips: ["ACA lapse reasons","Competitor pricing impact","Show by state"],
      },
      {
        id: 'segment-insight',
        type: 'insight',
        title: 'Segment Note',
        body: 'ACA retention pressure is concentrated in three states where new carrier entrants launched mid-year plans.',
        sources: ['Policy Master', 'Premium Register'],
        generationDetail: 'Segment retention cross-referenced with market entry events.',
        queryLogic: '-- Segment retention + market entry overlay',
        lineage: [{ id: 'l1', label: 'Policy Master' }],
        contextualFollowUpChips: ["Three affected states","Market entry timeline","ACA retention by state"],
      },
    ],
  },
]

export function findScenario(input: string): Scenario | null {
  const normalized = input.toLowerCase().trim()
  for (const scenario of scenarios) {
    if (scenario.matchPatterns.some((p) => normalized.includes(p))) {
      return scenario
    }
    if (normalized === scenario.question.toLowerCase()) {
      return scenario
    }
  }
  return null
}

export function resolveScenario(input: string): Scenario {
  return findScenario(input) ?? scenarios[Math.floor(Math.random() * scenarios.length)]
}

const FALLBACK_SCENARIO_ID = 'loss-ratio'

function withFallbackCards(scenario: Scenario): Card[] {
  if (scenario.cards.length > 0) return scenario.cards
  return scenarios.find((s) => s.id === FALLBACK_SCENARIO_ID)!.cards
}

function withExportDefaults(scenario: Scenario): Pick<Scenario, 'exportFileName' | 'exportFileSize'> {
  return {
    exportFileName: scenario.exportFileName ?? `${scenario.domain}_export.csv`,
    exportFileSize: scenario.exportFileSize ?? '1.8 MB',
  }
}

export function applyTriageLaneOverride(scenario: Scenario, lane: TriageLane | null): Scenario {
  if (!lane || lane === scenario.triageLane) {
    if (scenario.triageLane === 'export') {
      return { ...scenario, ...withExportDefaults(scenario), cards: [] }
    }
    return scenario
  }

  if (lane === 'export') {
    return {
      ...scenario,
      triageLane: 'export',
      origin: 'generated',
      cards: [],
      ...withExportDefaults(scenario),
      originalReportRef: undefined,
    }
  }

  if (lane === 'background') {
    return {
      ...scenario,
      triageLane: 'background',
      origin: 'generated',
      originalReportRef: undefined,
      cards: withFallbackCards(scenario),
      exportFileName: undefined,
      exportFileSize: undefined,
    }
  }

  return {
    ...scenario,
    triageLane: 'instant',
    origin: 'generated',
    cards: withFallbackCards(scenario),
    exportFileName: undefined,
    exportFileSize: undefined,
    originalReportRef: undefined,
  }
}

const REUSE_TEMPLATE_ID = 'claims-volume-reuse'

export function applyReuseOverride(scenario: Scenario): Scenario {
  const template = scenarios.find((s) => s.id === REUSE_TEMPLATE_ID)!
  return {
    ...scenario,
    origin: 'reused',
    triageLane: 'instant',
    summary: 'Matched an existing report in the library',
    originalReportRef: template.originalReportRef,
    narrative: template.narrative,
    refinementChips: template.refinementChips,
    cards: template.cards,
    exportFileName: undefined,
    exportFileSize: undefined,
  }
}

export function applyDemoModeOverride(scenario: Scenario, mode: DemoMode | null): Scenario {
  if (!mode || mode === 'reused') return scenario
  return applyTriageLaneOverride(scenario, mode)
}

export function getReuseTemplate(): Scenario {
  return scenarios.find((s) => s.id === REUSE_TEMPLATE_ID)!
}

export function scenarioToReport(scenario: Scenario): import('../types').Report {
  return {
    id: `report-${scenario.id}-${Date.now()}`,
    question: scenario.question,
    domain: scenario.domain,
    triageLane: scenario.triageLane,
    status: 'ready',
    origin: scenario.origin,
    originalReportRef: scenario.originalReportRef,
    cards: scenario.cards,
    exportFileName: scenario.exportFileName,
    exportFileSize: scenario.exportFileSize,
  }
}
