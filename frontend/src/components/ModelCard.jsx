import ScoreBar from './ScoreBar'

const PROVIDER_LABELS = {
  claude: 'Anthropic',
  gpt4o: 'OpenAI',
  gemini: 'Google',
}

const PROVIDER_COLORS = {
  claude: 'border-orange-500/40 bg-orange-500/5',
  gpt4o: 'border-green-500/40 bg-green-500/5',
  gemini: 'border-blue-500/40 bg-blue-500/5',
}

const PROVIDER_BADGE = {
  claude: 'bg-orange-500/20 text-orange-300',
  gpt4o: 'bg-green-500/20 text-green-300',
  gemini: 'bg-blue-500/20 text-blue-300',
}

const WINNER_LABELS = {
  latency: '⚡ Fastest',
  cost: '💰 Cheapest',
  quality: '🏆 Best Quality',
  length: '📏 Best Length',
}

function formatCost(usd) {
  if (usd === 0) return '$0.000000'
  if (usd < 0.0001) return `$${usd.toFixed(7)}`
  return `$${usd.toFixed(5)}`
}

function formatLatency(ms) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${Math.round(ms)}ms`
}

export default function ModelCard({ result, score, winners }) {
  const mid = result.model_id
  const isError = !!result.error
  const myWins = Object.entries(winners || {}).filter(([, w]) => w === mid).map(([m]) => m)

  return (
    <div className={`rounded-xl border flex flex-col ${PROVIDER_COLORS[mid]} border-gray-700`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50 flex items-start justify-between gap-2">
        <div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PROVIDER_BADGE[mid]}`}>
            {PROVIDER_LABELS[mid]}
          </span>
          <p className="mt-1 text-sm font-mono text-gray-300 truncate">{result.model_name}</p>
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          {myWins.map(metric => (
            <span key={metric} className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full whitespace-nowrap">
              {WINNER_LABELS[metric]}
            </span>
          ))}
        </div>
      </div>

      {/* Response body */}
      <div className="flex-1 px-4 py-3">
        {isError ? (
          <div className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3">
            <p className="font-semibold mb-1">API Error</p>
            <p className="text-xs font-mono break-all">{result.error}</p>
          </div>
        ) : (
          <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto scrollbar-thin">
            {result.response_text}
          </pre>
        )}
      </div>

      {/* Metrics footer */}
      <div className="px-4 py-3 border-t border-gray-700/50 space-y-2">
        <ScoreBar
          rank={score?.latency_rank}
          label="Latency"
          value={formatLatency(result.latency_ms)}
        />
        <ScoreBar
          rank={score?.cost_rank}
          label="Cost"
          value={formatCost(result.estimated_cost_usd)}
        />
        <ScoreBar
          rank={score?.length_rank}
          label="Length"
          value={`${score?.length_chars ?? 0} chars`}
        />
        <ScoreBar
          rank={score?.quality_rank}
          label="Quality (blind)"
          value={score?.quality_score != null ? `${score.quality_score}/5` : null}
        />

        <p className="text-xs text-gray-500 pt-1">
          Tokens: {result.input_tokens.toLocaleString()} in / {result.output_tokens.toLocaleString()} out
        </p>
      </div>
    </div>
  )
}
