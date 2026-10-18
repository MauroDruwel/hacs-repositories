import React, { useState, useEffect, useMemo, useTransition } from 'react'
import type { CatalogData, FilterState } from '../types'
import { Header } from './Header'
import { FilterSidebar } from './FilterSidebar'
import { RepositoryCard } from './RepositoryCard'
import {
  PackageOpen,
  X,
  ChevronDown,
  ArrowUp,
  Sparkles,
  Loader2,
  Database,
  Calendar,
} from 'lucide-react'

const PAGE_SIZE = 30

export const RepositoryCatalog: React.FC = () => {
  const [data, setData] = useState<CatalogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [page, setPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    selectedCategories: [],
    minStars: 0,
    minForks: 0,
    minWatchers: 0,
    maxOpenIssues: 999999,
    sort: 'updated',
  })

  // Load packages data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Respect BASE_PATH if set
        const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
        const res = await fetch(`${basePath}/data/packages.json`)
        if (!res.ok) {
          throw new Error(`Failed to load packages: HTTP ${res.status}`)
        }
        const json: CatalogData = await res.json()
        setData(json)
      } catch (err: any) {
        console.error('Failed to load catalog data:', err)
        setError(err.message || 'Failed to load catalog')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Scroll to top button visibility
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleFilterChange = (updates: Partial<FilterState>) => {
    startTransition(() => {
      setFilterState((prev) => ({ ...prev, ...updates }))
      setPage(1) // Reset page on filter change
    })
  }

  const handleResetFilters = () => {
    startTransition(() => {
      setFilterState({
        search: '',
        selectedCategories: [],
        minStars: 0,
        minForks: 0,
        minWatchers: 0,
        maxOpenIssues: 999999,
        sort: 'updated',
      })
      setPage(1)
    })
  }

  // Max values for slider ranges
  const maxValues = useMemo(() => {
    if (!data?.packages) {
      return { stars: 5000, forks: 500, watchers: 100, openIssues: 100 }
    }
    let stars = 0
    let forks = 0
    let watchers = 0
    let openIssues = 0
    for (const p of data.packages) {
      if (p.stars > stars) stars = p.stars
      if (p.forks > forks) forks = p.forks
      if (p.watchers > watchers) watchers = p.watchers
      if (p.openIssues > openIssues) openIssues = p.openIssues
    }
    return { stars, forks, watchers, openIssues }
  }, [data])

  // Filter and sort packages
  const filteredPackages = useMemo(() => {
    if (!data?.packages) return []

    const searchTokens = filterState.search
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean)

    const result = data.packages.filter((pkg) => {
      // Category filter
      if (
        filterState.selectedCategories.length > 0 &&
        !filterState.selectedCategories.includes(pkg.category)
      ) {
        return false
      }

      // Min metrics
      if (pkg.stars < filterState.minStars) return false
      if (pkg.forks < filterState.minForks) return false
      if (pkg.watchers < filterState.minWatchers) return false
      if (pkg.openIssues > filterState.maxOpenIssues) return false

      // Search match
      if (searchTokens.length > 0) {
        const target = `${pkg.fullName} ${pkg.description} ${pkg.owner} ${(pkg.topics || []).join(' ')}`.toLowerCase()
        const matchesAll = searchTokens.every((token) => target.includes(token))
        if (!matchesAll) return false
      }

      return true
    })

    // Sorting
    result.sort((a, b) => {
      switch (filterState.sort) {
        case 'stars':
          return b.stars - a.stars
        case 'forks':
          return b.forks - a.forks
        case 'newest': {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return bTime - aTime
        }
        case 'name':
          return a.name.localeCompare(b.name)
        case 'updated':
        default: {
          const aTime = new Date(a.updatedAt).getTime()
          const bTime = new Date(b.updatedAt).getTime()
          return bTime - aTime
        }
      }
    })

    return result
  }, [data, filterState])

  const visiblePackages = useMemo(() => {
    return filteredPackages.slice(0, page * PAGE_SIZE)
  }, [filteredPackages, page])

  const hasMore = visiblePackages.length < filteredPackages.length

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Header
        search={filterState.search}
        onSearchChange={(search) => handleFilterChange({ search })}
        totalCount={data?.totalCount ?? 0}
        filteredCount={filteredPackages.length}
        onToggleMobileFilters={() => setMobileFiltersOpen((prev) => !prev)}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Banner / Info Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
              <Database className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span>
                {data ? `${data.totalCount.toLocaleString()} HACS packages` : 'Loading...'}
              </span>
            </div>
            {data?.updatedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Catalog updated:{' '}
                  <strong className="font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(data.updatedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </strong>
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Automated Daily CI Sync</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-900 dark:text-slate-100">{filteredPackages.length.toLocaleString()}</strong> results
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <FilterSidebar
                categories={data?.categories || []}
                filterState={filterState}
                maxValues={maxValues}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
              />
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-3">
            {/* Active filter badges */}
            {(filterState.selectedCategories.length > 0 ||
              filterState.minStars > 0 ||
              filterState.search) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-400">Active filters:</span>
                {filterState.search && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                    Search: "{filterState.search}"
                    <button
                      type="button"
                      onClick={() => handleFilterChange({ search: '' })}
                      className="hover:text-sky-900 dark:hover:text-sky-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filterState.selectedCategories.map((key) => {
                  const cat = data?.categories.find((c) => c.key === key)
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {cat?.name || key}
                      <button
                        type="button"
                        onClick={() =>
                          handleFilterChange({
                            selectedCategories: filterState.selectedCategories.filter(
                              (c) => c !== key
                            ),
                          })
                        }
                        className="hover:text-slate-900 dark:hover:text-slate-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })}
                {filterState.minStars > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    ≥ {filterState.minStars} stars
                    <button
                      type="button"
                      onClick={() => handleFilterChange({ minStars: 0 })}
                      className="hover:text-amber-900 dark:hover:text-amber-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600 dark:text-sky-400" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Loading HACS catalog data...
                </p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                <p className="font-semibold">Unable to load catalog</p>
                <p className="mt-1 text-sm">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Package list */}
            {!loading && !error && visiblePackages.length > 0 && (
              <div className="flex flex-col gap-4">
                {visiblePackages.map((pkg) => (
                  <RepositoryCard key={`${pkg.category}:${pkg.fullName}`} pkg={pkg} />
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="mt-6 flex flex-col items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => p + 1)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <ChevronDown className="h-4 w-4" />
                      Load More (Showing {visiblePackages.length} of {filteredPackages.length})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && filteredPackages.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <PackageOpen className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                  No repositories found
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Try adjusting your search query or filter criteria.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-sky-700"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filters Slide-over / Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Filters</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto pr-1">
              <FilterSidebar
                categories={data?.categories || []}
                filterState={filterState}
                maxValues={maxValues}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
              />
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top floating button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          title="Scroll to top"
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
