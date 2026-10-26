import { useState } from 'react'

type Theme = 'system' | 'light' | 'dark'
const KEY = 'starter-kit-theme'

function read(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

/**
 * Light, dark, or follow the system. An explicit choice is written to <html data-theme> (the tokens in
 * index.css key off it) and remembered; "system" removes the attribute and the media query decides.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(read)

  function choose(next: Theme) {
    setTheme(next)
    const root = document.documentElement
    try {
      if (next === 'system') {
        delete root.dataset.theme
        localStorage.removeItem(KEY)
      } else {
        root.dataset.theme = next
        localStorage.setItem(KEY, next)
      }
    } catch {
      /* private mode: the choice still applies to this page */
    }
  }

  return (
    <div role="group" aria-label="Theme" className="inline-flex rounded-full border border-line bg-raised p-0.5 text-xs">
      {(['system', 'light', 'dark'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={theme === option}
          onClick={() => choose(option)}
          className={`rounded-full px-3 py-1 capitalize ${theme === option ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:text-ink'}`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
