import { useEffect, useState } from 'react'

type Mode = 'system' | 'light' | 'dark'
const KEY = 'starter-kit-mode'

function read(): Mode {
  try {
    const saved = localStorage.getItem(KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

function apply(mode: Mode) {
  const root = document.documentElement
  if (mode === 'system') delete root.dataset.mode
  else root.dataset.mode = mode
}

/**
 * Light, dark, or follow the system: the reader's colour **mode**, which is separate from the experience's *theme* (an author's choice,
 * a category). An explicit choice is written to <html data-mode> (the tokens in index.css key off it) and remembered; "system" removes the
 * attribute and the media query decides.
 */
export function ModeToggle() {
  const [mode, setMode] = useState<Mode>(read)

  // A remembered choice applies on load, not only after the next click.
  useEffect(() => apply(mode), [mode])

  function choose(next: Mode) {
    setMode(next)
    try {
      if (next === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, next)
    } catch {
      /* private mode: the choice still applies to this page */
    }
  }

  return (
    <div role="group" aria-label="Colour mode" className="inline-flex rounded-full border border-line bg-raised p-0.5 text-xs">
      {(['system', 'light', 'dark'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={mode === option}
          onClick={() => choose(option)}
          className={`rounded-full px-3 py-1 capitalize ${mode === option ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:text-ink'}`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
