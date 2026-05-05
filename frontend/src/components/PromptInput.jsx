export default function PromptInput({
  prompt, onPromptChange,
  temperature, onTemperatureChange,
  maxTokens, onMaxTokensChange,
  onSubmit, isLoading, keysReady,
}) {
  const canSubmit = keysReady && prompt.trim().length > 0 && !isLoading

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 resize-y focus:outline-none focus:border-indigo-500 transition-colors text-sm"
          rows={6}
          maxLength={8000}
          placeholder="Enter your prompt here…"
          value={prompt}
          onChange={e => onPromptChange(e.target.value)}
        />
        <span className="absolute bottom-3 right-3 text-xs text-gray-600">
          {prompt.length} / 8000
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Temperature <span className="font-mono text-indigo-400">{temperature.toFixed(2)}</span>
          </label>
          <input
            type="range" min={0} max={2} step={0.05}
            value={temperature}
            onChange={e => onTemperatureChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-0.5">
            <span>0 (deterministic)</span>
            <span>2 (creative)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Max tokens <span className="font-mono text-indigo-400">{maxTokens}</span>
          </label>
          <input
            type="range" min={64} max={4096} step={64}
            value={maxTokens}
            onChange={e => onMaxTokensChange(parseInt(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-0.5">
            <span>64</span>
            <span>4096</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          title={!keysReady ? 'Add at least one API key above' : undefined}
          className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Evaluating…
            </span>
          ) : 'Run Evaluation'}
        </button>
        {!keysReady && (
          <p className="text-xs text-amber-400/80">Add at least one API key above to run live evaluation</p>
        )}
      </div>
    </div>
  )
}
