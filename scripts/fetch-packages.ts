/**
 * HACS Repositories Data Fetcher
 *
 * Fetches repository lists from hacs/default, queries GitHub GraphQL API for metadata,
 * falls back to HACS data-v2 for resilience against rate limits or missing repos,
 * and writes the compiled static catalog dataset to public/data/packages.json.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export interface CategoryDef {
  key: string
  name: string
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'integration', name: 'Integration' },
  { key: 'plugin', name: 'Plugin' },
  { key: 'appdaemon', name: 'AppDaemon Apps' },
  { key: 'netdaemon', name: 'NetDaemon Apps' },
  { key: 'python_script', name: 'Python script' },
  { key: 'theme', name: 'Theme' },
]

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

export interface CatalogData {
  updatedAt: string
  totalCount: number
  categories: {
    key: string
    name: string
    count: number
  }[]
  packages: PackageItem[]
}

const HACS_RAW_BASE = 'https://raw.githubusercontent.com/hacs/default/master/'
const HACS_DATA_V2_BASE = 'https://data-v2.hacs.xyz/'
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'

const BATCH_SIZE = 40
const MAX_ATTEMPTS = 3
const DEFAULT_RATE_LIMIT_WAIT_MS = 60_000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface HacsDataV2Item {
  full_name?: string
  description?: string
  stargazers_count?: number
  open_issues?: number
  last_updated?: string
  last_version?: string
  topics?: string[]
  manifest_name?: string
}

async function fetchCategoryRepoList(categoryKey: string): Promise<string[]> {
  const url = `${HACS_RAW_BASE}${categoryKey}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch category repo list for ${categoryKey}: ${res.statusText}`)
  }
  return (await res.json()) as string[]
}

async function fetchHacsDataV2(categoryKey: string): Promise<Map<string, HacsDataV2Item>> {
  const url = `${HACS_DATA_V2_BASE}${categoryKey}/data.json`
  const map = new Map<string, HacsDataV2Item>()
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`HACS data-v2 fetch returned ${res.status} for ${categoryKey}`)
      return map
    }
    const data = (await res.json()) as Record<string, HacsDataV2Item>
    for (const item of Object.values(data)) {
      if (item && item.full_name) {
        map.set(item.full_name.toLowerCase(), item)
      }
    }
  } catch (err) {
    console.warn(`Could not load HACS data-v2 fallback for ${categoryKey}:`, err)
  }
  return map
}

function getRateLimitWaitMs(headers: Headers): number {
  const retryAfter = Number(headers.get('retry-after'))
  if (retryAfter > 0) {
    return retryAfter * 1000
  }
  const reset = Number(headers.get('x-ratelimit-reset'))
  if (headers.get('x-ratelimit-remaining') === '0' && reset > 0) {
    return Math.max(0, reset * 1000 - Date.now()) + 1000
  }
  return DEFAULT_RATE_LIMIT_WAIT_MS
}

async function fetchGraphQLBatch(
  batch: PackageItem[],
  token: string
): Promise<{ success: boolean; data?: Record<string, any>; waitMs?: number }> {
  const queryParts: string[] = []
  const aliasMap = new Map<string, PackageItem>()

  batch.forEach((pkg, index) => {
    const parts = pkg.fullName.split('/')
    if (parts.length === 2) {
      const [owner, repo] = parts
      const alias = `r${index}`
      aliasMap.set(alias, pkg)
      queryParts.push(
        `${alias}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(repo)}) {
          name
          nameWithOwner
          description
          url
          homepageUrl
          stargazerCount
          forkCount
          watchers { totalCount }
          issues(states: OPEN) { totalCount }
          updatedAt
          createdAt
          licenseInfo { spdxId }
        }`
      )
    }
  })

  if (queryParts.length === 0) return { success: true }

  const query = `query {\n${queryParts.join('\n')}\n}`

  try {
    const res = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'hacs-repositories',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    if (res.status === 403 || res.status === 429) {
      const waitMs = getRateLimitWaitMs(res.headers)
      return { success: false, waitMs }
    }

    if (!res.ok) {
      return { success: false, waitMs: 5000 }
    }

    const json = (await res.json()) as any
    if (json.errors && (!json.data || Object.keys(json.data).length === 0)) {
      const isRateLimit = json.errors.some((e: any) => e.type === 'RATE_LIMITED')
      if (isRateLimit) {
        return { success: false, waitMs: DEFAULT_RATE_LIMIT_WAIT_MS }
      }
    }

    if (json.data) {
      for (const [alias, repoData] of Object.entries(json.data)) {
        if (!repoData) continue
        const pkg = aliasMap.get(alias)
        if (!pkg) continue

        const rd = repoData as any
        pkg.description = rd.description || pkg.description || ''
        pkg.url = rd.url || pkg.url
        pkg.homepageUrl = rd.homepageUrl || pkg.homepageUrl
        pkg.stars = rd.stargazerCount ?? pkg.stars
        pkg.forks = rd.forkCount ?? pkg.forks
        pkg.watchers = rd.watchers?.totalCount ?? pkg.watchers
        pkg.openIssues = rd.issues?.totalCount ?? pkg.openIssues
        pkg.createdAt = rd.createdAt || pkg.createdAt
        pkg.updatedAt = rd.updatedAt || pkg.updatedAt
        if (rd.licenseInfo?.spdxId && rd.licenseInfo.spdxId !== 'NOASSERTION') {
          pkg.license = rd.licenseInfo.spdxId
        }
      }
    }

    return { success: true, data: json.data }
  } catch (err) {
    return { success: false, waitMs: 3000 }
  }
}

export async function runDataPipeline(options: {
  limit?: number
  skipGraphql?: boolean
  outputPath?: string
}) {
  const token = process.env.GITHUB_TOKEN || ''
  const shouldRunGraphql = !options.skipGraphql && Boolean(token)

  console.log('🚀 Starting HACS Repositories Data Pipeline...')
  console.log(`   GitHub Token available: ${Boolean(token)}`)
  console.log(`   GraphQL metadata enabled: ${shouldRunGraphql}`)
  if (options.limit) {
    console.log(`   Limit per category: ${options.limit}`)
  }

  const allPackages: PackageItem[] = []
  const categoryCounts: { key: string; name: string; count: number }[] = []

  for (const cat of CATEGORIES) {
    console.log(`\n📦 Processing category: ${cat.name} (${cat.key})...`)
    const rawList = await fetchCategoryRepoList(cat.key)
    const hacsData = await fetchHacsDataV2(cat.key)

    const listToProcess = options.limit ? rawList.slice(0, options.limit) : rawList
    console.log(`   Found ${rawList.length} repos (processing ${listToProcess.length})`)

    const categoryPackages: PackageItem[] = []

    for (const fullName of listToProcess) {
      const parts = fullName.split('/')
      const owner = parts[0] || ''
      const name = parts[1] || fullName
      const v2 = hacsData.get(fullName.toLowerCase())

      const pkg: PackageItem = {
        name,
        fullName,
        owner,
        category: cat.key,
        categoryName: cat.name,
        description: v2?.description || '',
        url: `https://github.com/${fullName}`,
        stars: v2?.stargazers_count ?? 0,
        forks: 0,
        watchers: v2?.stargazers_count ?? 0,
        openIssues: v2?.open_issues ?? 0,
        createdAt: undefined,
        updatedAt: v2?.last_updated || new Date().toISOString(),
        topics: v2?.topics || [],
        version: v2?.last_version,
      }

      categoryPackages.push(pkg)
    }

    categoryCounts.push({
      key: cat.key,
      name: cat.name,
      count: categoryPackages.length,
    })
    allPackages.push(...categoryPackages)
  }

  // GraphQL Enrichment if token is provided and not skipped
  if (shouldRunGraphql) {
    console.log(`\n⚡ Enriching ${allPackages.length} packages with GitHub GraphQL metadata...`)
    const batches: PackageItem[][] = []
    for (let i = 0; i < allPackages.length; i += BATCH_SIZE) {
      batches.push(allPackages.slice(i, i + BATCH_SIZE))
    }

    let successCount = 0
    let failedCount = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      let attempts = 0
      let done = false

      while (attempts < MAX_ATTEMPTS && !done) {
        attempts++
        const res = await fetchGraphQLBatch(batch, token)
        if (res.success) {
          done = true
          successCount++
          process.stdout.write(`\r   Progress: [${i + 1}/${batches.length}] batches completed (${Math.round(((i + 1) / batches.length) * 100)}%)`)
        } else {
          const wait = res.waitMs || 5000
          console.warn(`\n   Batch ${i + 1} failed (attempt ${attempts}/${MAX_ATTEMPTS}), waiting ${Math.round(wait / 1000)}s...`)
          await sleep(wait)
        }
      }

      if (!done) {
        failedCount++
      }

      // Small throttle between batches to avoid bursts
      await sleep(250)
    }

    console.log(`\n   GraphQL enrichment complete: ${successCount} succeeded, ${failedCount} failed.`)
  } else if (!token && !options.skipGraphql) {
    console.log('\n⚠️  No GITHUB_TOKEN set. Using HACS data-v2 metadata for all packages.')
  }

  // Sort default: last updated desc
  allPackages.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const catalogData: CatalogData = {
    updatedAt: new Date().toISOString(),
    totalCount: allPackages.length,
    categories: categoryCounts,
    packages: allPackages,
  }

  const outPath = resolve(options.outputPath || 'public/data/packages.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(catalogData, null, 2), 'utf-8')
  console.log(`\n✅ Successfully generated catalog with ${catalogData.totalCount} packages!`)
  console.log(`   Saved to: ${outPath}`)

  // Also write metadata summary
  const metaPath = resolve(dirname(outPath), 'meta.json')
  writeFileSync(
    metaPath,
    JSON.stringify(
      {
        updatedAt: catalogData.updatedAt,
        totalCount: catalogData.totalCount,
        categories: catalogData.categories,
      },
      null,
      2
    ),
    'utf-8'
  )
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const limit = limitArg
    ? parseInt(limitArg.split('=')[1], 10)
    : args.includes('--quick')
    ? 20
    : undefined
  const skipGraphql = args.includes('--skip-graphql')
  const outArg = args.find((a) => a.startsWith('--out='))
  const outputPath = outArg ? outArg.split('=')[1] : undefined

  runDataPipeline({ limit, skipGraphql, outputPath }).catch((err) => {
    console.error('Fatal error running data pipeline:', err)
    process.exit(1)
  })
}
