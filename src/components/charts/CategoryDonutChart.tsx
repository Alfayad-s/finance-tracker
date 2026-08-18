import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { CategoryIcon } from '@/utils/categoryIcons'
import { formatCurrency } from '@/utils/currency'

export interface CategorySlice {
  id: string
  name: string
  color: string
  icon: string
  amount: number
}

export function CategoryDonutChart({
  slices,
  total,
  currency,
}: {
  slices: CategorySlice[]
  total: number
  currency: string
}) {
  return (
    <div className="mt-5 flex items-center gap-4">
      <p className="sr-only">
        Spending this month by category, totaling {formatCurrency(total, currency)}
      </p>
      <div className="size-36 shrink-0" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="amount"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
              animationDuration={400}
            >
              {slices.map((slice) => (
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                const item = payload?.[0]
                if (!item) return null
                const amount = Number(item.value ?? 0)
                const percent = total > 0 ? Math.round((amount / total) * 100) : 0
                return (
                  <ChartTooltip
                    active={active}
                    rows={[
                      {
                        name: String(item.name),
                        value: `${formatCurrency(amount, currency)} · ${percent}%`,
                        color: String(item.payload?.color ?? item.color ?? ''),
                      },
                    ]}
                  />
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center gap-2 text-sm">
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${slice.color}1a`, color: slice.color }}
            >
              <CategoryIcon name={slice.icon} className="size-3.5" />
            </span>
            <span className="min-w-0 truncate text-slate-700">{slice.name}</span>
            <span className="ml-auto shrink-0 font-medium text-slate-900">
              {formatCurrency(slice.amount, currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
