import { useEffect, useMemo, useState } from 'react'
import { supabase, type Application, type StudentProfile } from '../lib/supabase'
import {
  fetchJobs,
  emojiForCompany,
  stripHtml,
  truncate,
  timeAgo,
  extractCountry,
  extractDomain,
  estimateSalary,
  buildRequirements,
  SALARY_RANGES,
  type ApiJob,
} from '../lib/jobApi'
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
  Filter,
  X,
} from './icons'

type JobTypeFilter = 'all' | 'remote' | 'full_time' | 'internship' | 'contract'

const TYPE_FILTERS: { key: JobTypeFilter; label: string }[] = [
  { key: 'all', label: 'All types' },
  { key: 'remote', label: 'Remote' },
  { key: 'full_time', label: 'Full-time' },
  { key: 'internship', label: 'Internship' },
  { key: 'contract', label: 'Contract' },
]

function matchesType(job: ApiJob, filter: JobTypeFilter): boolean {
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

  // Filters
  const [typeFilter, setTypeFilter] = useState<JobTypeFilter>('all')
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [domainFilter, setDomainFilter] = useState('all')
  const [salaryFilter, setSalaryFilter] = useState('all')

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [jobsData, appsRes, profileRes] = await Promise.all([
        fetchJobs(),
        supabase.from('applications').select('*'),
        supabase.from('student_profiles').select('*').limit(1).maybeSingle(),
      ])
      setJobs(jobsData)
      setApplications((appsRes.data as Application[]) ?? [])
      setProfile(profileRes.data as StudentProfile | null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
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

  // Precompute country/domain/salary per job once
  const enriched = useMemo(
    () =>
      jobs.map((j) => ({
        job: j,
        country: extractCountry(j.location),
        domain: extractDomain(j),
        salary: estimateSalary(j),
      })),
    [jobs],
  )

  // Build dropdown options from data
  const countries = useMemo(() => {
    const set = new Set<string>()
    enriched.forEach((e) => set.add(e.country))
    return ['all', ...Array.from(set).sort()]
  }, [enriched])

  const domains = useMemo(() => {
    const set = new Set<string>()
    enriched.forEach((e) => set.add(e.domain))
    return ['all', ...Array.from(set).sort()]
  }, [enriched])

  const filteredJobs = useMemo(() => {
    const salaryRange = SALARY_RANGES.find((r) => r.key === salaryFilter) ?? SALARY_RANGES[0]
    return enriched
      .filter((e) => matchesType(e.job, typeFilter))
      .filter((e) => countryFilter === 'all' || e.country === countryFilter)
      .filter((e) => domainFilter === 'all' || e.domain === domainFilter)
      .filter((e) => e.salary.min >= salaryRange.min && e.salary.min <= salaryRange.max)
      .filter((e) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
          e.job.title.toLowerCase().includes(q) ||
          e.job.company_name.toLowerCase().includes(q) ||
          e.job.location.toLowerCase().includes(q) ||
          e.job.tags.some((t) => t.toLowerCase().includes(q))
        )
      })
      .map((e) => e.job)
  }, [enriched, typeFilter, countryFilter, domainFilter, salaryFilter, search])

  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (countryFilter !== 'all' ? 1 : 0) +
    (domainFilter !== 'all' ? 1 : 0) +
    (salaryFilter !== 'all' ? 1 : 0) +
    (search.trim() ? 1 : 0)

  function clearAll() {
    setTypeFilter('all')
    setCountryFilter('all')
    setDomainFilter('all')
    setSalaryFilter('all')
    setSearch('')
  }

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
        <button onClick={loadData} className="btn-primary">
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
            {filteredJobs.length} of {jobs.length} real open positions — updated hourly via Arbeitnow.
          </p>
        </div>
        <button onClick={loadData} className="btn-ghost self-start">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Advanced filter bar */}
      <div className="card space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-brand-600" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filters</span>
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500">
              <X className="h-3.5 w-3.5" /> Clear all ({activeFilterCount})
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField label="Country / Location" value={countryFilter} onChange={setCountryFilter} options={countries.map((c) => ({ value: c, label: c === 'all' ? 'All countries' : c }))} />
          <SelectField label="Domain" value={domainFilter} onChange={setDomainFilter} options={domains.map((d) => ({ value: d, label: d === 'all' ? 'All domains' : d }))} />
          <SelectField label="Salary Range" value={salaryFilter} onChange={setSalaryFilter} options={SALARY_RANGES.map((r) => ({ value: r.key, label: r.label }))} />
          <SelectField label="Job Type" value={typeFilter} onChange={(v) => setTypeFilter(v as JobTypeFilter)} options={TYPE_FILTERS.map((f) => ({ value: f.key, label: f.label }))} />
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search role, company, or tech…"
          className="input"
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
          const salary = estimateSalary(job)

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
                <span className="inline-flex items-center text-slate-400">{salary.label}</span>
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
          <p className="text-sm text-slate-400">No roles match your filters right now.</p>
          <button onClick={clearAll} className="mt-3 btn-ghost">
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input cursor-pointer appearance-none pr-9"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </label>
  )
}
