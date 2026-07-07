import type { ReactNode } from 'react'

const SQL_KEYWORDS = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'FULL',
  'CROSS',
  'ON',
  'AND',
  'OR',
  'NOT',
  'IN',
  'BETWEEN',
  'LIKE',
  'IS',
  'NULL',
  'AS',
  'DISTINCT',
  'GROUP',
  'BY',
  'ORDER',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'UNION',
  'ALL',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'WITH',
  'OVER',
  'PARTITION',
  'ASC',
  'DESC',
  'TRUE',
  'FALSE',
])

const SQL_FUNCTIONS = new Set([
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'ROUND',
  'COALESCE',
  'NULLIF',
  'DATE_TRUNC',
  'CAST',
  'EXTRACT',
  'ROW_NUMBER',
  'RANK',
  'LAG',
  'LEAD',
])

function highlightSql(code: string): ReactNode[] {
  const tokens = code.match(/'[^']*'|--[^\n]*|\b\w+\b|\S|\s+/g) ?? [code]

  return tokens.map((token, i) => {
    let className = 'text-body'
    const upper = token.toUpperCase()

    if (token.startsWith("'")) className = 'text-accent'
    else if (token.startsWith('--')) className = 'italic text-border-form'
    else if (SQL_KEYWORDS.has(upper)) className = 'font-semibold text-brand'
    else if (SQL_FUNCTIONS.has(upper)) className = 'text-impact'
    else if (/^\d/.test(token)) className = 'text-body/70'

    return (
      <span key={i} className={className}>
        {token}
      </span>
    )
  })
}

interface SqlCodeBlockProps {
  sql: string
  className?: string
}

export function SqlCodeBlock({ sql, className = '' }: SqlCodeBlockProps) {
  return (
    <pre
      className={`max-h-72 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words rounded border border-border bg-white p-4 font-mono text-xs leading-relaxed ${className}`}
    >
      <code>{highlightSql(sql)}</code>
    </pre>
  )
}
