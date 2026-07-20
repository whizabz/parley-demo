export type LineageNodeType = 'source' | 'table' | 'query' | 'output'

export interface LineageGraphNode {
  id: string
  label: string
  type: LineageNodeType
  restricted?: boolean
  x: number
  y: number
}

export interface LineageGraphEdge {
  from: string
  to: string
  restricted?: boolean
}

export interface LineageGraph {
  nodes: LineageGraphNode[]
  edges: LineageGraphEdge[]
  width: number
  height: number
}

const STAGING_BY_SOURCE: Record<string, string> = {
  'Claims Ledger': 'claims_ledger.claims_fact',
  'Premium Register': 'premium_register.earned_premium',
  'Adjuster Notes': 'adjuster_notes.notes_enriched',
  'Policy Master': 'policy_master.enrollment',
  'Actuarial Reserve Model': 'actuarial.reserve_ibnr',
  'Risk Adjustment Model': 'actuarial.risk_adjustment_scores',
}

function toSourceSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_')
}

export function buildLineageGraph(cardSources: string[]): LineageGraph {
  const sourceNames = [...new Set(cardSources)]
  if (!sourceNames.includes('Risk Adjustment Model')) {
    sourceNames.push('Risk Adjustment Model')
  }

  const nodes: LineageGraphNode[] = []
  const edges: LineageGraphEdge[] = []

  const columns = { source: 20, table: 168, query: 360, output: 520 }
  const rowGap = 92
  const startY = 36

  sourceNames.forEach((name, index) => {
    const y = startY + index * rowGap
    const restricted = name === 'Risk Adjustment Model'
    const sourceId = `source-${index}`
    const tableId = `table-${index}`

    nodes.push({
      id: sourceId,
      label: toSourceSlug(name),
      type: 'source',
      restricted,
      x: columns.source,
      y,
    })

    nodes.push({
      id: tableId,
      label: STAGING_BY_SOURCE[name] ?? `${toSourceSlug(name)}.staging`,
      type: 'table',
      restricted,
      x: columns.table,
      y,
    })

    edges.push({ from: sourceId, to: tableId, restricted })
    edges.push({ from: tableId, to: 'query', restricted })
  })

  const centerY = startY + ((sourceNames.length - 1) * rowGap) / 2

  nodes.push({
    id: 'query',
    label: 'result',
    type: 'query',
    x: columns.query,
    y: centerY,
  })

  nodes.push({
    id: 'output',
    label: 'parley.report_output',
    type: 'output',
    x: columns.output,
    y: centerY,
  })

  edges.push({ from: 'query', to: 'output' })

  const height = Math.max(220, startY + sourceNames.length * rowGap + 24)

  return {
    nodes,
    edges,
    width: 640,
    height,
  }
}
