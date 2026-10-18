import React from 'react'
import type { CategorySummary, FilterState, SortMode } from '../types'
import {
  RotateCcw,
  SlidersHorizontal,
  Star,
  GitFork,
  Eye,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowDownAZ,
  Check,
} from 'lucide-react'

interface Props {
  categories: CategorySummary[]
  filterState: FilterState
  maxValues: {
    stars: number
    forks: number
    watchers: number
    openIssues: number
  }
  onFilterChange: (updates: Partial<FilterState>) => void
  onReset: () => void
}

const SORT_OPTIONS: { id: SortMode; label: string; icon: React.ReactNode }[] = [
  { id: 'updated', label: 'Recently Updated', icon: <Clock className="h-3.5 w-3.5" /> },
  { id: 'stars', label: 'Most Stars', icon: <Star className="h-3.5 w-3.5" /> },
  { id: 'newest', label: 'Newest Added', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: 'forks', label: 'Most Forks', icon: <GitFork className="h-3.5 w-3.5" /> },
  { id: 'name', label: 'Name (A-Z)', icon: <ArrowDownAZ className="h-3.5 w-3.5" /> },
]

export const FilterSidebar: React.FC<Props> = ({
  categories,
  filterState,
  maxValues,
  onFilterChange,
  onReset,
}) => {
  const toggleCategory = (key: string) => {
    const current = filterState.selectedCategories
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key]
    onFilterChange({ selectedCategories: next })
  }

  const selectAllCategories = () => {
    onFilterChange({ selectedCategories: [] })
  }

  const isFiltered =
    filterState.selectedCategories.length > 0 ||
    filterState.minStars > 0 ||
    filterState.minForks > 0 ||
    filterState.minWatchers > 0 ||
    filterState.maxOpenIssues < maxValues.openIssues ||
    filterState.search.length > 0

  return (
    <aside className="flex flex-col gap-6">
      {/* Reset button & Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
          <SlidersHorizontal className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span>Filters & Sort</span>
        </div>
        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            <RotateCcw className="h-3 w-3" />
            Reset all
          </button>
        )}
      </div>

      {/* Sort Section */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Sort Order
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {SORT_OPTIONS.map((opt) => {
            const active = filterState.sort === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onFilterChange({ sort: opt.id })}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800'
                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {active && <Check className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Categories
          </label>
          {filterState.selectedCategories.length > 0 && (
            <button
              type="button"
              onClick={selectAllCategories}
              className="text-xs text-sky-600 hover:underline dark:text-sky-400"
            >
              All
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => {
            const isChecked =
              filterState.selectedCategories.length === 0 ||
              filterState.selectedCategories.includes(cat.key)

            return (
              <label
                key={cat.key}
                className="group flex cursor-pointer items-center justify-between rounded-lg border border-transparent px-3 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(cat.key)}
                    className="h-3.5 w-3.5 rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span>{cat.name}</span>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {cat.count}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Numeric Sliders */}
      <div className="flex flex-col gap-4 border-t border-slate-200/80 pt-4 dark:border-slate-800">
        {/* Min Stars */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              Min Stars
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              {filterState.minStars > 0 ? `≥ ${filterState.minStars}` : 'Any'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.min(maxValues.stars, 5000)}
            step={25}
            value={filterState.minStars}
            onChange={(e) => onFilterChange({ minStars: Number(e.target.value) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-sky-600 dark:bg-slate-800 dark:accent-sky-500"
          />
        </div>

        {/* Min Forks */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
              <GitFork className="h-3.5 w-3.5 text-slate-500" />
              Min Forks
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              {filterState.minForks > 0 ? `≥ ${filterState.minForks}` : 'Any'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.min(maxValues.forks, 500)}
            step={5}
            value={filterState.minForks}
            onChange={(e) => onFilterChange({ minForks: Number(e.target.value) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-sky-600 dark:bg-slate-800 dark:accent-sky-500"
          />
        </div>

        {/* Min Watchers */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              Min Watchers
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              {filterState.minWatchers > 0 ? `≥ ${filterState.minWatchers}` : 'Any'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.min(maxValues.watchers, 100)}
            step={1}
            value={filterState.minWatchers}
            onChange={(e) => onFilterChange({ minWatchers: Number(e.target.value) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-sky-600 dark:bg-slate-800 dark:accent-sky-500"
          />
        </div>

        {/* Max Open Issues */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
              <AlertCircle className="h-3.5 w-3.5 text-slate-500" />
              Max Open Issues
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              {filterState.maxOpenIssues < maxValues.openIssues
                ? `≤ ${filterState.maxOpenIssues}`
                : 'Any'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.min(maxValues.openIssues, 200)}
            step={5}
            value={filterState.maxOpenIssues}
            onChange={(e) => onFilterChange({ maxOpenIssues: Number(e.target.value) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-sky-600 dark:bg-slate-800 dark:accent-sky-500"
          />
        </div>
      </div>
    </aside>
  )
}
