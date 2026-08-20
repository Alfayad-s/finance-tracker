export function ChartTooltip({
  active,
  label,
  rows,
}: {
  active?: boolean
  label?: string
  rows?: { name: string; value: string; color?: string }[]
}) {
  if (!active || !rows?.length) return null

  return (
    <div className="rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-sm">
      {label ? <p className="text-xs font-medium text-slate-700">{label}</p> : null}
      <ul className={label ? 'mt-1 space-y-0.5' : 'space-y-0.5'}>
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-2 text-xs text-slate-600">
            {row.color ? (
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
            ) : null}
            <span className="truncate">{row.name}</span>
            <span className="ml-auto shrink-0 font-medium text-slate-900">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
