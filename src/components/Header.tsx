import React, { useEffect, useState } from 'react'
import { Search, X, Moon, Sun, Filter } from 'lucide-react'

interface Props {
  search: string
  onSearchChange: (value: string) => void
  totalCount: number
  filteredCount: number
  onToggleMobileFilters?: () => void
}

export const Header: React.FC<Props> = ({
  search,
  onSearchChange,
  totalCount,
  filteredCount,
  onToggleMobileFilters,
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        const input = document.getElementById('search-input')
        input?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2.5">
            <img
              src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/logos/hacs-repositories-transparent-blue.svg`}
              alt="HACS Repositories Logo"
              className="h-8 w-auto"
            />
            <span className="hidden text-base font-bold tracking-tight text-slate-900 sm:inline dark:text-slate-100">
              HACS <span className="text-sky-600 dark:text-sky-400">Repositories</span>
            </span>
          </a>
        </div>

        {/* Search bar */}
        <div className="relative flex-1 max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            id="search-input"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search ${totalCount.toLocaleString()} repositories... (Press '/' to focus)`}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-10 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:bg-slate-900"
          />
          {search && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 gap-1.5">
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                {filteredCount}
              </span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={onToggleMobileFilters}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Toggle filters"
          >
            <Filter className="h-4 w-4" />
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com/HugoGresse/hacs-repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            title="View on GitHub"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  )
}
