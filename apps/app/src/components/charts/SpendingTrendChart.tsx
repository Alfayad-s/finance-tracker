import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { useMoneyText } from '@/hooks/useAmountPrivacy'
import { formatMonthShort } from '@/utils/date'

const INCOME_COLOR = '#93c5fd'
const SPENT_COLOR = '#2563eb'

export function SpendingTrendChart({
  months,
  currency,
}: {
  months: { month: string; income: number; expense: number }[]
  currency: string
}) {
  const money = useMoneyText()
  const data = months.map((row) => ({
    ...row,
    label: formatMonthShort(row.month),
  }))

  return (
    <>
      <table className="sr-only">
        <caption>Income and spending for the last 6 months</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Income</th>
            <th scope="col">Spent</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month}>
              <td>{row.label}</td>
              <td>{money(row.income, currency)}</td>
              <td>{money(row.expense, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="h-44 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="28%" margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#dbeafe" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            width={44}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(value: number) => money(value, currency, { compact: true })}
            tickCount={4}
          />
          <Tooltip
            cursor={{ fill: '#eff6ff' }}
            content={({ active, payload, label }) => (
              <ChartTooltip
                active={active}
                label={String(label ?? '')}
                rows={(payload ?? []).map((item) => ({
                  name: String(item.name),
                  value: money(Number(item.value ?? 0), currency),
                  color: String(item.color ?? ''),
                }))}
              />
            )}
          />
          <Bar
            dataKey="income"
            name="Income"
            fill={INCOME_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={18}
            animationDuration={400}
          />
          <Bar
            dataKey="expense"
            name="Spent"
            fill={SPENT_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={18}
            animationDuration={400}
          />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </>
  )
}
