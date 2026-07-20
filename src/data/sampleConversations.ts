import type { Conversation, Version } from '../types'
import { scenarios, scenarioToReport } from './scenarios'

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

function versionFromScenario(
  scenarioId: string,
  opts: {
    versionId: string
    createdAt: string
    favorited?: boolean
    bookmarkName?: string
    responseKind?: Version['responseKind']
    exportFileName?: string
    exportFileSize?: string
    accessRequestStatus?: Version['accessRequestStatus']
    selectedFailureActionId?: Version['selectedFailureActionId']
  },
): Version {
  const scenario = scenarios.find((s) => s.id === scenarioId)
  if (!scenario) throw new Error(`Missing sample scenario: ${scenarioId}`)

  const report = scenarioToReport(scenario)
  report.id = `sample-report-${opts.versionId}`
  if (!scenario.failureKind || scenario.failureKind === 'partial') {
    report.status = 'ready'
  }

  if (opts.responseKind === 'text' || opts.responseKind === 'failure') {
    report.cards = []
  }
  if (opts.exportFileName) report.exportFileName = opts.exportFileName
  if (opts.exportFileSize) report.exportFileSize = opts.exportFileSize

  const responseKind =
    opts.responseKind ??
    (scenario.failureKind === 'system' || scenario.failureKind === 'access-denied'
      ? 'failure'
      : 'report')

  return {
    id: opts.versionId,
    question: scenario.question,
    summary: scenario.summary,
    report,
    narrative: scenario.narrative,
    refinementChips: scenario.refinementChips,
    responseKind,
    createdAt: opts.createdAt,
    favorited: opts.favorited ?? false,
    bookmarkName: opts.bookmarkName,
    failureKind: scenario.failureKind,
    restrictedSources: scenario.restrictedSources,
    restrictedSourceOwner: scenario.restrictedSourceOwner,
    narrowQuestion: scenario.narrowQuestion,
    recoveryScenarioId: scenario.recoveryScenarioId,
    accessRequestStatus:
      opts.accessRequestStatus ?? (scenario.failureKind ? 'idle' : undefined),
    selectedFailureActionId: opts.selectedFailureActionId,
  }
}

function conversation(
  id: string,
  version: Version,
  pinned: boolean,
  updatedAt: string,
  opts?: { pinOrder?: number; archived?: boolean; customTitle?: string; archivedAt?: string },
): Conversation {
  const archived = opts?.archived ?? false
  return {
    id,
    title: version.question,
    versions: [version],
    createdAt: version.createdAt,
    updatedAt,
    pinned: archived ? false : pinned,
    archived: archived || undefined,
    archivedAt: archived ? (opts?.archivedAt ?? updatedAt) : undefined,
    customTitle: opts?.customTitle,
    ...(pinned && !archived
      ? {
          pinnedAt: updatedAt,
          pinOrder: opts?.pinOrder ?? 0,
        }
      : {}),
  }
}

/** Seed chats so the demo sidebar never looks empty on a fresh load. */
export const sampleConversations: Conversation[] = [
  conversation(
    'sample-conv-claims-region',
    versionFromScenario('claims-region', {
      versionId: 'sample-ver-claims-region',
      createdAt: daysAgo(0.4),
      favorited: true,
      bookmarkName: 'Claims by region',
    }),
    false,
    daysAgo(0.4),
  ),
  conversation(
    'sample-conv-export',
    versionFromScenario('export-claims', {
      versionId: 'sample-ver-export',
      createdAt: daysAgo(1),
      favorited: true,
      bookmarkName: 'Claims line items 2019–2024',
    }),
    false,
    daysAgo(1),
  ),
  conversation(
    'sample-conv-loss-ratio',
    versionFromScenario('loss-ratio', {
      versionId: 'sample-ver-loss-ratio',
      createdAt: daysAgo(2),
      favorited: true,
      bookmarkName: 'Loss ratio YTD',
    }),
    true,
    daysAgo(2),
    { pinOrder: 0 },
  ),
  conversation(
    'sample-conv-export-aca',
    versionFromScenario('export-claims', {
      versionId: 'sample-ver-export-aca',
      createdAt: daysAgo(3),
      favorited: true,
      bookmarkName: 'ACA lapse extract',
      exportFileName: 'aca_lapse_events_q2.csv',
      exportFileSize: '180 KB',
    }),
    false,
    daysAgo(3),
  ),
  conversation(
    'sample-conv-retention',
    versionFromScenario('premium-retention', {
      versionId: 'sample-ver-retention',
      createdAt: daysAgo(5),
      favorited: true,
      bookmarkName: 'Retention by segment',
    }),
    true,
    daysAgo(5),
    { pinOrder: 1 },
  ),
  conversation(
    'sample-conv-claims-volume',
    versionFromScenario('claims-volume-reuse', {
      versionId: 'sample-ver-claims-volume',
      createdAt: daysAgo(3),
    }),
    false,
    daysAgo(3),
  ),
  conversation(
    'sample-conv-monthly',
    versionFromScenario('monthly-breakdown', {
      versionId: 'sample-ver-monthly',
      createdAt: daysAgo(6),
      responseKind: 'text',
    }),
    false,
    daysAgo(6),
  ),
  conversation(
    'sample-conv-cohort',
    versionFromScenario('retention-cohort', {
      versionId: 'sample-ver-cohort',
      createdAt: daysAgo(8),
    }),
    false,
    daysAgo(8),
  ),
  conversation(
    'sample-conv-access-denied',
    versionFromScenario('access-denied-actuarial', {
      versionId: 'sample-ver-access-denied',
      createdAt: daysAgo(0.15),
    }),
    false,
    daysAgo(0.15),
  ),
  conversation(
    'sample-conv-system-failure',
    versionFromScenario('system-failure-reserves', {
      versionId: 'sample-ver-system-failure',
      createdAt: daysAgo(0.6),
    }),
    false,
    daysAgo(0.6),
  ),
  conversation(
    'sample-conv-archived-weekly',
    versionFromScenario('monthly-breakdown', {
      versionId: 'sample-ver-archived-weekly',
      createdAt: daysAgo(12),
    }),
    false,
    daysAgo(12),
    {
      archived: true,
      customTitle: 'June weekly loss ratios',
      archivedAt: daysAgo(10),
    },
  ),
  conversation(
    'sample-conv-archived-volume',
    versionFromScenario('claims-volume-reuse', {
      versionId: 'sample-ver-archived-volume',
      createdAt: daysAgo(18),
    }),
    false,
    daysAgo(18),
    {
      archived: true,
      customTitle: 'Regional claims volume',
      archivedAt: daysAgo(14),
    },
  ),
  conversation(
    'sample-conv-archived-retention',
    versionFromScenario('premium-retention', {
      versionId: 'sample-ver-archived-retention',
      createdAt: daysAgo(24),
    }),
    false,
    daysAgo(24),
    {
      archived: true,
      customTitle: 'Segment retention review',
      archivedAt: daysAgo(20),
    },
  ),
]

/** Library-only samples (ids `sample-lib-*`) — fill Artifacts without bloating Recent. */
const libraryOnlyArtifacts: Version[] = [
  versionFromScenario('claims-region', {
    versionId: 'sample-lib-se-claims',
    createdAt: daysAgo(0.8),
    favorited: true,
    bookmarkName: 'Southeast claims surge',
  }),
  versionFromScenario('loss-ratio', {
    versionId: 'sample-lib-lr-commercial',
    createdAt: daysAgo(1.2),
    favorited: true,
    bookmarkName: 'Commercial loss ratio',
  }),
  versionFromScenario('export-claims', {
    versionId: 'sample-lib-paid-export',
    createdAt: daysAgo(1.5),
    favorited: true,
    bookmarkName: 'Paid claims extract',
    exportFileName: 'paid_claims_h1_2026.csv',
    exportFileSize: '890 KB',
  }),
  versionFromScenario('premium-retention', {
    versionId: 'sample-lib-aca-retention',
    createdAt: daysAgo(2.1),
    favorited: true,
    bookmarkName: 'ACA retention watch',
  }),
  versionFromScenario('retention-cohort', {
    versionId: 'sample-lib-cohort-h2',
    createdAt: daysAgo(2.7),
    favorited: true,
    bookmarkName: 'H2 2025 cohort',
  }),
  versionFromScenario('claims-volume-reuse', {
    versionId: 'sample-lib-volume-west',
    createdAt: daysAgo(3.4),
    favorited: true,
    bookmarkName: 'West volume snapshot',
  }),
  versionFromScenario('monthly-breakdown', {
    versionId: 'sample-lib-june-weekly',
    createdAt: daysAgo(4),
    favorited: true,
    bookmarkName: 'June weekly ratios',
  }),
  versionFromScenario('export-claims', {
    versionId: 'sample-lib-open-claims',
    createdAt: daysAgo(4.5),
    favorited: true,
    bookmarkName: 'Open claims inventory',
    exportFileName: 'open_claims_inventory.csv',
    exportFileSize: '420 KB',
  }),
  versionFromScenario('loss-ratio', {
    versionId: 'sample-lib-lr-prior-year',
    createdAt: daysAgo(5.2),
    favorited: true,
    bookmarkName: 'Prior-year loss ratio',
  }),
  versionFromScenario('claims-region', {
    versionId: 'sample-lib-midwest',
    createdAt: daysAgo(5.8),
    favorited: true,
    bookmarkName: 'Midwest claims trend',
  }),
  versionFromScenario('premium-retention', {
    versionId: 'sample-lib-large-group',
    createdAt: daysAgo(6.3),
    favorited: true,
    bookmarkName: 'Large group retention',
  }),
  versionFromScenario('export-claims', {
    versionId: 'sample-lib-denials',
    createdAt: daysAgo(7),
    favorited: true,
    bookmarkName: 'Denial line items',
    exportFileName: 'denial_line_items_q1.csv',
    exportFileSize: '310 KB',
  }),
  versionFromScenario('retention-cohort', {
    versionId: 'sample-lib-commercial-cohort',
    createdAt: daysAgo(7.5),
    favorited: true,
    bookmarkName: 'Commercial cohort detail',
  }),
  versionFromScenario('claims-volume-reuse', {
    versionId: 'sample-lib-volume-refresh',
    createdAt: daysAgo(8.2),
    favorited: true,
    bookmarkName: 'Claims volume refresh',
  }),
  versionFromScenario('loss-ratio', {
    versionId: 'sample-lib-severity',
    createdAt: daysAgo(9),
    favorited: true,
    bookmarkName: 'Severity-driven losses',
  }),
  versionFromScenario('export-claims', {
    versionId: 'sample-lib-cat-export',
    createdAt: daysAgo(9.5),
    favorited: true,
    bookmarkName: 'CAT claims extract',
    exportFileName: 'cat_claims_se_2026.csv',
    exportFileSize: '1.1 MB',
  }),
  versionFromScenario('premium-retention', {
    versionId: 'sample-lib-small-group',
    createdAt: daysAgo(10),
    favorited: true,
    bookmarkName: 'Small group retention',
  }),
  versionFromScenario('monthly-breakdown', {
    versionId: 'sample-lib-may-weekly',
    createdAt: daysAgo(11),
    favorited: true,
    bookmarkName: 'May weekly ratios',
  }),
  versionFromScenario('claims-region', {
    versionId: 'sample-lib-ne-claims',
    createdAt: daysAgo(12),
    favorited: true,
    bookmarkName: 'Northeast claims view',
  }),
  versionFromScenario('export-claims', {
    versionId: 'sample-lib-adjuster',
    createdAt: daysAgo(13),
    favorited: true,
    bookmarkName: 'Adjuster notes pull',
    exportFileName: 'adjuster_notes_export.csv',
    exportFileSize: '640 KB',
  }),
  versionFromScenario('retention-cohort', {
    versionId: 'sample-lib-early-lapse',
    createdAt: daysAgo(14),
    favorited: true,
    bookmarkName: 'Early lapse analysis',
  }),
  versionFromScenario('loss-ratio', {
    versionId: 'sample-lib-lob',
    createdAt: daysAgo(15),
    favorited: true,
    bookmarkName: 'Loss ratio by LOB',
  }),
]

/** Favorited sample artifacts used to seed the library on fresh installs. */
export const sampleArtifacts: Version[] = [
  ...sampleConversations.flatMap((c) => c.versions).filter((v) => v.favorited),
  ...libraryOnlyArtifacts,
].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
