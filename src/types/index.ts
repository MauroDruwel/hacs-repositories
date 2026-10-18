export interface PackageItem {
  name: string
  fullName: string
  owner: string
  category: string
  categoryName: string
  description: string
  url: string
  homepageUrl?: string
  license?: string
  stars: number
  forks: number
  watchers: number
  openIssues: number
  createdAt?: string
  updatedAt: string
  topics?: string[]
  version?: string
}

export interface CategorySummary {
  key: string
  name: string
  count: number
}

export interface CatalogData {
  updatedAt: string
  totalCount: number
  categories: CategorySummary[]
  packages: PackageItem[]
}

export type SortMode = 'updated' | 'newest' | 'stars' | 'forks' | 'name'

export interface FilterState {
  search: string
  selectedCategories: string[]
  minStars: number
  minForks: number
  minWatchers: number
  maxOpenIssues: number
  sort: SortMode
}
