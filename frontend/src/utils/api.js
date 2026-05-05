import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({ baseURL: BASE_URL })

export async function runEvaluation(payload) {
  const res = await client.post('/evaluate', payload)
  return res.data
}

// --- Run history (keys are never stored) ---

const HISTORY_KEY = 'llm_eval_history'
const MAX_HISTORY = 10

export function saveToHistory(run) {
  const history = getHistory()
  // Strip API keys before storing
  const { anthropic_api_key, openai_api_key, google_api_key, ...safe } = run
  const entry = { ...safe, timestamp: Date.now(), id: crypto.randomUUID() }
  const updated = [entry, ...history].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []
  } catch {
    return []
  }
}

export function exportHistoryAsJSON() {
  const data = JSON.stringify(getHistory(), null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `llm-eval-history-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

// --- API key persistence ---

const KEYS_KEY = 'llm_eval_keys'

export function saveKeys(keys) {
  localStorage.setItem(KEYS_KEY, JSON.stringify(keys))
}

export function loadKeys() {
  try {
    return JSON.parse(localStorage.getItem(KEYS_KEY)) || { anthropic: '', openai: '', google: '' }
  } catch {
    return { anthropic: '', openai: '', google: '' }
  }
}

export function clearKeys() {
  localStorage.removeItem(KEYS_KEY)
  localStorage.removeItem('llm_eval_models')
}

// --- Model selection persistence ---

const MODELS_KEY = 'llm_eval_models'

const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  google: 'gemini-1.5-flash',
}

export function saveModels(models) {
  localStorage.setItem(MODELS_KEY, JSON.stringify(models))
}

export function loadModels() {
  try {
    return { ...DEFAULT_MODELS, ...(JSON.parse(localStorage.getItem(MODELS_KEY)) || {}) }
  } catch {
    return DEFAULT_MODELS
  }
}
