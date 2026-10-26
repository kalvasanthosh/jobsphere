import { useEffect, useState } from 'react'
import { supabase, type Application, type StudentProfile } from '../lib/supabase'
import {
  MapPin,
  CheckCircle,
  Briefcase,
  BadgeCheck,
  Check,
  Loader,
  Globe,
  RefreshCw,
  AlertCircle,
} from './icons'

type ApiJob = {
  slug: string
  company_name: string
  title: string
  description: string
  remote: boolean
  url: string
  tags: string[]
  job_types: string[]
  location: string
  created_at: number
}

const API_URL = 'https://www.arbeitnow.com/api/job-board-api'

const COMPANY_EMOJIS = ['🚀', '💳', '⛰️', '📊', '🏢', '🛰️', '🧪', '⚡', '🔧', '🎨', '🌐', '🔬', '💡', '🏗️', '🤖', '📱']

function emojiForCompany(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return COMPANY_EMOJIS[Math.abs(hash) % COMPANY_EMOJIS.length]
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim()
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

function timeAgo(unix: number): string {
  const diff = Date.now() / 1000 - unix
  const days = Math.floor(diff / 86400)
  if (days >= 1) return `${days}d ago`
  const hours = Math.floor(diff / 3600)
  if (hours >= 1) return `${hours}h ago`
  const mins = Math.floor(diff / 60)
  return mins >= 1 ? `${mins}m ago` : 'just now'
}

type FilterKey = 'all' | 'remote' | 'full_time' | 'internship' | 'contract'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All roles' },
  { key: 'remote', label: 'Remote' },
  { key: 'full_time', label: 'Full-time' },
  { key: 'internship', label: 'Internship' },
  { key: 'contract', label: 'Contract' },
]

function matchesFilter(job: ApiJob, filter: FilterKey): boolean {
  if (filter === 'all') return true
  if (filter === 'remote') return job.remote
  const types = job.job_types.map((t) => t.toLowerCase())
  if (filter === 'full_time') return types.some((t) => t.includes('full'))
  if (filter === 'internship') return types.some((t) => t.includes('intern') || t.includes('trainee'))
  if (filter === 'contract') return types.some((t) => t.includes('contract') || t.includes('freelance'))
  return true
}

export function JobsView() {
  const [jobs, setJobs] = useState<ApiJob[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applyingSlug, setApplyingSlug] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [jobsRes, appsRes, profileRes] = await Promise.all([
        fetch(API_URL),
        supabase.from('applications').select('*'),
        supabase.from('student_profiles').select('*').limit(1).maybeSingle(),
      ])
      if (!jobsRes.ok) throw new Error(`API returned ${jobsRes.status}`)
      const json = await jobsRes.json()
      const fetched = (json.data ?? []) as ApiJob[]
      setJobs(fetched)
      setApplications((appsRes.data as Application[]) ?? [])
      setProfile(profileRes.data as StudentProfile | null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  async function refresh() {
    await loadData()
  }

  const appliedSlugs = new Set(applications.map((a) => a.job_id))

  async function applyToJob(job: ApiJob) {
    if (appliedSlugs.has(job.slug) || applyingSlug) return
    setApplyingSlug(job.slug)
    const payload: { job_id: string; student_profile_id?: string } = { job_id: job.slug }
    if (profile?.id) payload.student_profile_id = profile.id
    const { data } = await supabase.from('applications').insert(payload).select('*').maybeSingle()
    if (data) {
      setApplications((prev) => [...prev, data as Application])
    }
    setApplyingSlug(null)
  }

  const filteredJobs = jobs
    .filter((j) => matchesFilter(j, filter))
    .filter((j) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        j.title.toLowerCase().includes(q) ||
        j.company_name.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q))
      )
    })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader className="h-7 w-7 animate-spin text-brand-500" />
        <p className="text-sm text-slate-500">Fetching live job listings…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Couldn't load job listings</h3>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
        </div>
        <button onClick={refresh} className="btn-primary">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Live Job Board</h2>
          <p className="text-sm text-slate-500">
            {filteredJobs.length} real open positions — updated hourly via Arbeitnow.
          </p>
        </div>
        <button onClick={refresh} className="btn-ghost self-start">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 self-start overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                filter === f.key ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search role, company, or tech…"
          className="input flex-1"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredJobs.map((job) => {
          const applied = appliedSlugs.has(job.slug)
          const isApplying = applyingSlug === job.slug
          const cleanDesc = truncate(stripHtml(job.description), 280)
          const jobType = job.job_types[0] || 'Full Time'
          const companyEmoji = emojiForCompany(job.company_name)
          const requirements = buildRequirements(job)

          return (
            <article
              key={job.slug}
              className="card flex flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cardhover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-slate-100 text-2xl">
                    {companyEmoji}
                  </div>
                  <div>
                    <h3 className="font-bold leading-snug text-slate-900">{job.title}</h3>
                    <p className="text-sm text-slate-500">{job.company_name}</p>
                  </div>
                </div>
                <span className="tag flex-none bg-brand-50 text-brand-700">
                  <Briefcase className="mr-1 h-3 w-3" />
                  {jobType}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" /> {job.location || 'Location not specified'}
                </span>
                {job.remote && (
                  <span className="inline-flex items-center gap-1 text-accent-600">
                    <Globe className="h-3.5 w-3.5" /> Remote
                  </span>
                )}
                <span className="inline-flex items-center text-slate-400">{timeAgo(job.created_at)}</span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">{cleanDesc}</p>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Basic Requirements
                </p>
                <ul className="space-y-1.5">
                  {requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border border-slate-300 text-slate-400">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {job.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.tags.slice(0, 6).map((t) => (
                    <span key={t} className="tag bg-slate-100 text-slate-600">{t}</span>
                  ))}
                </div>
              )}

              <div className="mt-5 flex flex-none items-center gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => applyToJob(job)}
                  disabled={applied || isApplying}
                  className={`flex-1 justify-center transition-all duration-300 ${
                    applied
                      ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-accent-50 px-4 py-2.5 text-sm font-semibold text-accent-700'
                      : 'btn-primary'
                  }`}
                >
                  {isApplying ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" /> Applying…
                    </>
                  ) : applied ? (
                    <>
                      <CheckCircle className="h-4 w-4" /> Successfully Applied
                    </>
                  ) : (
                    <>
                      <BadgeCheck className="h-4 w-4" /> Apply With Portfolio
                    </>
                  )}
                </button>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost flex-none"
                  title="View original posting"
                >
                  <Globe className="h-4 w-4" />
                </a>
              </div>
              {applied && (
                <p className="mt-2 text-center text-xs text-slate-400 animate-fadeIn">
                  Your portfolio was sent to {job.company_name}.
                </p>
              )}
            </article>
          )
        })}
      </div>

      {filteredJobs.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-400">No roles match your search right now.</p>
          <button onClick={() => { setFilter('all'); setSearch('') }} className="mt-3 btn-ghost">
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

function buildRequirements(job: ApiJob): string[] {
  const reqs: string[] = []
  const techTags = job.tags.filter((t) => t !== 'Tech' && t.length > 1)
  if (techTags.length > 0) {
    reqs.push(`Tech stack: ${techTags.slice(0, 4).join(', ')}`)
  }
  reqs.push(job.remote ? 'Remote-friendly — work from anywhere' : `Based in ${job.location || 'specified location'}`)
  reqs.push('GitHub portfolio link recommended')
  const types = job.job_types.join(' / ')
  if (types) reqs.push(`Role type: ${types}`)
  if (reqs.length < 4) reqs.push('Strong communication skills in English')
  return reqs.slice(0, 5)
}
