const WIDTH  = { 1: 'w-full', 2: 'w-2/3', 3: 'w-1/3' }
const COLOR  = { 1: 'bg-emerald-500', 2: 'bg-amber-400', 3: 'bg-red-500' }

export default function ScoreBar({ rank, label, value }) {
  if (rank == null) {
    return (
      <div className="space-y-0.5">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{label}</span>
          <span className="italic">—</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="font-mono">{value ?? '—'} <span className="text-gray-500">#{rank}</span></span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${WIDTH[rank] ?? 'w-1/3'} ${COLOR[rank] ?? 'bg-red-500'}`} />
      </div>
    </div>
  )
}
