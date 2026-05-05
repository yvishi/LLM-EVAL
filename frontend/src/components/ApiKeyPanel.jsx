import { useState } from 'react'

const ANTHROPIC_MODELS = [
  'claude-opus-4-7',
  'claude-sonnet-4-20250514',
  'claude-haiku-4-5-20251001',
]

const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'o1-mini',
]

const GOOGLE_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
]

function KeyRow({ label, keyValue, onKeyChange, modelValue, onModelChange, models, placeholder }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <span className="text-sm text-gray-400 w-28 shrink-0">{label}</span>
      <div className="relative flex-1">
        <input
          type={visible ? 'text' : 'password'}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 pr-9 font-mono"
          placeholder={placeholder}
          value={keyValue}
          onChange={e => onKeyChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
          title={visible ? 'Hide' : 'Show'}
        >
          {visible ? '🙈' : '👁'}
        </button>
      </div>
      <select
        value={modelValue}
        onChange={e => onModelChange(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500 shrink-0"
      >
        {models.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  )
}

export default function ApiKeyPanel({ keys, onKeysChange, models, onModelsChange, onClear, isOpen, onToggle }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        <span>🔑 Use your own API keys</span>
        <span className="text-gray-500 text-xs">{isOpen ? '▲ collapse' : '▼ expand'}</span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          <KeyRow
            label="Anthropic"
            keyValue={keys.anthropic}
            onKeyChange={v => onKeysChange({ ...keys, anthropic: v })}
            modelValue={models.anthropic}
            onModelChange={v => onModelsChange({ ...models, anthropic: v })}
            models={ANTHROPIC_MODELS}
            placeholder="sk-ant-…"
          />
          <KeyRow
            label="OpenAI"
            keyValue={keys.openai}
            onKeyChange={v => onKeysChange({ ...keys, openai: v })}
            modelValue={models.openai}
            onModelChange={v => onModelsChange({ ...models, openai: v })}
            models={OPENAI_MODELS}
            placeholder="sk-…"
          />
          <KeyRow
            label="Google"
            keyValue={keys.google}
            onKeyChange={v => onKeysChange({ ...keys, google: v })}
            modelValue={models.google}
            onModelChange={v => onModelsChange({ ...models, google: v })}
            models={GOOGLE_MODELS}
            placeholder="AIza…"
          />
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-600">
              Keys are stored only in your browser and sent directly to the APIs. Never logged on our server.
            </p>
            <button
              onClick={onClear}
              className="text-xs text-red-400/70 hover:text-red-400 whitespace-nowrap ml-4 transition-colors"
            >
              Clear saved keys
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
