import React, { useState } from 'react'
import type { PackageItem } from '../types'
import {
  Star,
  GitFork,
  Eye,
  AlertCircle,
  Calendar,
  Clock,
  Shield,
  ExternalLink,
  Copy,
  Check,
  Tag,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { getReadme } from '../utils/getReadme'

interface Props {
  pkg: PackageItem
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  integration: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800/50',
  },
  plugin: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800/50',
  },
  appdaemon: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/50',
  },
  netdaemon: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/50',
  },
  python_script: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800/50',
  },
  theme: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/50',
  },
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Unknown'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Unknown'

  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths}mo ago`
  const diffYears = Math.floor(diffDays / 365)
  return `${diffYears}y ago`
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

export const RepositoryCard: React.FC<Props> = ({ pkg }) => {
  const [copied, setCopied] = useState(false)
  const [showReadme, setShowReadme] = useState(false)
  const [readmeHtml, setReadmeHtml] = useState<string | null>(null)
  const [readmeLoading, setReadmeLoading] = useState(false)
  const [readmeError, setReadmeError] = useState<string | null>(null)

  const copyUrl = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(pkg.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleReadme = async () => {
    if (showReadme) {
      setShowReadme(false)
      return
    }
    setShowReadme(true)
    if (!readmeHtml && !readmeLoading) {
      setReadmeLoading(true)
      setReadmeError(null)
      try {
        const html = await getReadme(pkg.fullName)
        setReadmeHtml(html)
      } catch (err: any) {
        setReadmeError(err.message || 'Failed to load README')
      } finally {
        setReadmeLoading(false)
      }
    }
  }

  const color = CATEGORY_COLORS[pkg.category] || {
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  }

  return (
    <article className="group relative rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-sky-700">
      <div className="flex flex-col gap-3">
        {/* Header row: title, category badge, and copy button */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={pkg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link flex items-center gap-1.5 font-mono text-base font-semibold text-slate-900 transition-colors hover:text-sky-600 dark:text-slate-100 dark:hover:text-sky-400"
              >
                <span className="truncate">{pkg.fullName}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover/link:opacity-100" />
              </a>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${color.bg} ${color.text} ${color.border}`}
              >
                {pkg.categoryName}
              </span>
              {pkg.version && (
                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-mono text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {pkg.version}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleReadme}
              title={showReadme ? 'Hide README' : 'Show README'}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">README</span>
              {showReadme ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <button
              type="button"
              onClick={copyUrl}
              title={copied ? 'Copied repository URL!' : 'Copy repository URL'}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {pkg.description || <span className="italic text-slate-400">No description provided</span>}
        </p>

        {/* Topics / Tags */}
        {pkg.topics && pkg.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {pkg.topics.slice(0, 5).map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800/80 dark:text-slate-400"
              >
                <Tag className="h-2.5 w-2.5" />
                {topic}
              </span>
            ))}
            {pkg.topics.length > 5 && (
              <span className="text-xs text-slate-400 self-center">
                +{pkg.topics.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Metrics & Dates Footer */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800/60 dark:text-slate-400">
          <div className="flex items-center gap-1" title="Stars">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {formatNumber(pkg.stars)}
            </span>
          </div>

          <div className="flex items-center gap-1" title="Forks">
            <GitFork className="h-3.5 w-3.5" />
            <span>{formatNumber(pkg.forks)}</span>
          </div>

          <div className="flex items-center gap-1" title="Watchers">
            <Eye className="h-3.5 w-3.5" />
            <span>{formatNumber(pkg.watchers)}</span>
          </div>

          <div className="flex items-center gap-1" title="Open Issues">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{formatNumber(pkg.openIssues)}</span>
          </div>

          {pkg.license && (
            <div className="flex items-center gap-1" title={`License: ${pkg.license}`}>
              <Shield className="h-3.5 w-3.5" />
              <span>{pkg.license}</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            {pkg.createdAt && (
              <div
                className="hidden items-center gap-1 sm:flex"
                title={`Created: ${new Date(pkg.createdAt).toLocaleDateString()}`}
              >
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{formatRelativeTime(pkg.createdAt)}</span>
              </div>
            )}

            <div
              className="flex items-center gap-1"
              title={`Last Updated: ${new Date(pkg.updatedAt).toLocaleDateString()}`}
            >
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>updated {formatRelativeTime(pkg.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Expandable README Panel */}
        {showReadme && (
          <div className="mt-2 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70">
            {readmeLoading && (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                <span>Loading README...</span>
              </div>
            )}
            {readmeError && (
              <div className="py-2 text-xs text-red-600 dark:text-red-400">
                <p>{readmeError}</p>
                <a
                  href={`${pkg.url}#readme`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 font-medium text-sky-600 hover:underline dark:text-sky-400"
                >
                  Open README on GitHub <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {readmeHtml && (
              <div
                className="max-h-[500px] overflow-y-auto text-sm text-slate-700 dark:text-slate-300 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_img]:max-w-full [&_img]:rounded-md [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-slate-100 [&_code]:rounded-sm [&_code]:bg-slate-200/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs dark:[&_code]:bg-slate-800 [&_a]:text-sky-600 dark:[&_a]:text-sky-400 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: readmeHtml }}
              />
            )}
          </div>
        )}
      </div>
    </article>
  )
}
