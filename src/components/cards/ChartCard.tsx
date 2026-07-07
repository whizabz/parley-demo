import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import type { ChartCard as ChartCardType } from '../../types'

interface Props {
  card: ChartCardType
}

export function ChartCard({ card }: Props) {
  const isYoY = card.data.some((d) => d.value2 !== undefined)

  return (
    <div>
      <h3 className="mb-4 text-base font-semibold text-brand">{card.title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {card.chartType === 'line' ? (
            <LineChart data={card.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#002677" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          ) : (
            <BarChart data={card.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              {isYoY && <Legend />}
              <Bar dataKey="value" fill="#002677" name="2026" radius={[2, 2, 0, 0]} />
              {isYoY && <Bar dataKey="value2" fill="#196ecf" name="2025" radius={[2, 2, 0, 0]} />}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
