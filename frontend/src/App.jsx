import { useState, useEffect } from 'react'
import ApiKeyPanel from './components/ApiKeyPanel'
import PromptInput from './components/PromptInput'
import ModelCard from './components/ModelCard'
import {
  runEvaluation,
  saveToHistory, getHistory, clearHistory, exportHistoryAsJSON,
  saveKeys, loadKeys, clearKeys,
  saveModels, loadModels,
} from './utils/api'
import { DEMO_DATASETS } from './utils/demoData'

const PRESETS = [
  { id: 'code', label: 'Code', prompt: 'Write a Python function that finds all prime numbers up to n using the Sieve of Eratosthenes. Include docstring and type hints.' },
  { id: 'reasoning', label: 'Reasoning', prompt: 'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost? Show your step-by-step reasoning.' },
  { id: 'creative', label: 'Creative', prompt: 'Write a short poem (8-12 lines) about the feeling of watching a city wake up at dawn, in the style of Pablo Neruda.' },
  { id: 'summarization', label: 'Summarize', prompt: 'Summarize the key ideas behind the CAP theorem in distributed systems in 3 concise bullet points suitable for a junior engineer.' },
  { id: 'qa', label: 'Q&A', prompt: 'What is the difference between TCP and UDP? When would you prefer one over the other? Give a practical example for each.' },
  { id: 'translation', label: 'Translate', prompt: 'Translate the following sentence to French, Spanish, and Japanese, preserving tone: "The early bird catches the worm, but the second mouse gets the cheese."' },
]

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-xl border border-gray-700 bg-gray-800/50 h-96 animate-pulse" />
      ))}
    </div>
  )
}

function HistoryPanel({ history, onExport, onClear, onRestore }) {
  const [open, setOpen] = useState(false)
  if (!history.length) return null
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        <span>📋 Run history ({history.length})</span>
        <span className="text-gray-500 text-xs">{open ? '▲ collapse' : '▼ expand'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <div className="flex gap-3 mb-3">
            <button onClick={onExport} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Export JSON
            </button>
            <button onClick={onClear} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">
              Clear history
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {history.map(run => (
              <button
                key={run.id}
                onClick={() => onRestore(run)}
                className="w-full text-left px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <p className="text-xs text-gray-400 truncate">{run.prompt_echo}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {new Date(run.timestamp).toLocaleString()} · winner: {Object.values(run.winner_by_metric || {}).join(', ') || '—'}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(512)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [history, setHistory] = useState([])
  const [keys, setKeys] = useState({ anthropic: '', openai: '', google: '' })
  const [models, setModels] = useState({
    anthropic: 'claude-sonnet-4-20250514',
    openai: 'gpt-4o',
    google: 'gemini-1.5-flash',
  })
  const [keysOpen, setKeysOpen] = useState(false)
  const [activePreset, setActivePreset] = useState(null)

  useEffect(() => {
    setKeys(loadKeys())
    setModels(loadModels())
    setHistory(getHistory())
  }, [])

  const keysReady = keys.anthropic.trim() || keys.openai.trim() || keys.google.trim()

  function handleKeysChange(newKeys) {
    setKeys(newKeys)
    saveKeys(newKeys)
  }

  function handleModelsChange(newModels) {
    setModels(newModels)
    saveModels(newModels)
  }

  function handleClearKeys() {
    clearKeys()
    setKeys({ anthropic: '', openai: '', google: '' })
    setModels({ anthropic: 'claude-sonnet-4-20250514', openai: 'gpt-4o', google: 'gemini-1.5-flash' })
  }

  function handlePreset(preset) {
    setActivePreset(preset.id)
    setPrompt(preset.prompt)
  }

  function handleRunDemo(datasetIndex = 0) {
    const dataset = DEMO_DATASETS[datasetIndex]
    setResults(dataset)
    setPrompt(dataset.prompt_echo)
    setIsDemoMode(true)
    setError(null)
  }

  async function handleSubmit() {
    if (!keysReady || !prompt.trim()) return
    setIsLoading(true)
    setError(null)
    setResults(null)
    setIsDemoMode(false)
    try {
      const data = await runEvaluation({
        prompt: prompt.trim(),
        temperature,
        max_tokens: maxTokens,
        anthropic_api_key: keys.anthropic,
        openai_api_key: keys.openai,
        google_api_key: keys.google,
        anthropic_model: models.anthropic,
        openai_model: models.openai,
        google_model: models.google,
      })
      setResults(data)
      saveToHistory(data)
      setHistory(getHistory())
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg || JSON.stringify(d)).join('; ')
        : typeof detail === 'string'
        ? detail
        : err.message || 'Request failed'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  function handleRestoreHistory(run) {
    setPrompt(run.prompt_echo)
    setResults(run)
    setIsDemoMode(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white">LLM Eval Playground</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Compare Claude, GPT-4o, and Gemini side by side — latency, cost, quality.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* API Key Panel */}
        <ApiKeyPanel
          keys={keys}
          onKeysChange={handleKeysChange}
          models={models}
          onModelsChange={handleModelsChange}
          onClear={handleClearKeys}
          isOpen={keysOpen}
          onToggle={() => setKeysOpen(o => !o)}
        />

        {/* Demo bar — visible when keys aren't all filled */}
        {!keysReady && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-700 bg-gray-900/30">
            <span className="text-sm text-gray-500">No keys? See it in action instantly:</span>
            {DEMO_DATASETS.map((d, i) => (
              <button
                key={d.id}
                onClick={() => handleRunDemo(i)}
                className="text-sm px-4 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 transition-colors"
              >
                {['Code', 'Q&A', 'Creative'][i]} demo
              </button>
            ))}
          </div>
        )}

        {/* Preset row */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => handlePreset(p)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                activePreset === p.id
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Prompt input */}
        <PromptInput
          prompt={prompt}
          onPromptChange={setPrompt}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          maxTokens={maxTokens}
          onMaxTokensChange={setMaxTokens}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          keysReady={!!keysReady}
        />

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && <LoadingSkeleton />}

        {/* Demo mode banner */}
        {results && isDemoMode && (
          <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-center gap-2">
            <span>⚡</span>
            <span>Showing pre-computed demo results. Add your API keys above to run live evaluation.</span>
          </div>
        )}

        {/* Results grid */}
        {results && !isLoading && (
          <div className={`grid grid-cols-1 gap-6 ${
            results.results.length === 1 ? 'max-w-lg mx-auto' :
            results.results.length === 2 ? 'md:grid-cols-2' :
            'md:grid-cols-3'
          }`}>
            {results.results.map(r => (
              <ModelCard
                key={r.model_id}
                result={r}
                score={results.scores?.[r.model_id]}
                winners={results.winner_by_metric || {}}
              />
            ))}
          </div>
        )}

        {/* History */}
        <HistoryPanel
          history={history}
          onExport={exportHistoryAsJSON}
          onClear={() => { clearHistory(); setHistory([]) }}
          onRestore={handleRestoreHistory}
        />

      </main>
    </div>
  )
}
