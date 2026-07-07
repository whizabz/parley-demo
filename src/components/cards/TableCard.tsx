import type { TableCard as TableCardType } from '../../types'

interface Props {
  card: TableCardType
}

export function TableCard({ card }: Props) {
  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-brand">{card.title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {card.columns.map((col) => (
                <th key={col} className="px-2 py-2 text-left font-semibold text-brand">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {card.rows.map((row, i) => (
              <tr key={i} className="border-b border-border/50">
                {row.map((cell, j) => (
                  <td key={j} className="px-2 py-2 text-body">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
