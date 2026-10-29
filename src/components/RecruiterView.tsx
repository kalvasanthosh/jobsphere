import { useEffect, useMemo, useState } from 'react'
import {
  fetchJobs,
  emojiForCompany,
  stripHtml,
  truncate,
  extractJobSkills,
  type ApiJob,
} from '../lib/jobApi'
import { generateApplicants, rankApplicants, type RankedApplicant } from '../lib/matchRanker'
import {
  Loader,
  RefreshCw,
  AlertCircle,
  Briefcase,
  MapPin,
  ChevronDown,
  Trophy,
  TrendingUp,
  Users,
  Sparkles,
  Check,
  BadgeCheck,
} from './icons'

export function RecruiterView() {
  const [jobs, setJobs] = useState<ApiJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchJobs()
      // Show the first 12 jobs for the recruiter board (enough variety without overwhelming)
      setJobs(data.slice(0, 12))
      // Auto-expand the first job
      if (data.length > 0) setExpandedSlug(data[0].slug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  // Precompute applicants + rankings per job (stable per slug via seeded generator)
  const rankedByJob = useMemo(() => {
    const map = new Map<string, RankedApplicant[]>()
    for (const job of jobs) {
      const applicants = generateApplicants(job, 6)
      map.set(job.slug, rankApplicants(job, applicants))
    }
    return map
  }, [jobs])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader className="h-7 w-7 animate-spin text-brand-500" />
        <p className="text-sm text-slate-500">Loading recruiter dashboard…</p>
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
          <h3 className="font-bold text-slate-900">Couldn't load job postings</h3>
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
          <h2 className="text-lg font-bold text-slate-900">Recruiter Dashboard</h2>
          <p className="text-sm text-slate-500">
            AI-powered candidate ranking for your open roles. Applicants are auto-sorted by match score.
          </p>
        </div>
        <button onClick={loadData} className="btn-ghost self-start">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => {
          const ranked = rankedByJob.get(job.slug) ?? []
          const isExpanded = expandedSlug === job.slug
          const topApplicant = ranked[0]
          const jobSkills = extractJobSkills(job)
          const companyEmoji = emojiForCompany(job.company_name)

          return (
            <div key={job.slug} className="card overflow-hidden">
              {/* Job header row (clickable to expand) */}
              <button
                onClick={() => setExpandedSlug(isExpanded ? null : job.slug)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-slate-50/60 sm:p-5"
              >
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-slate-100 text-xl">
                  {companyEmoji}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-slate-900">{job.title}</h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                    <span>{job.company_name}</span>
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" /> {job.location || 'Unspecified'}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Briefcase className="h-3 w-3" /> {job.job_types[0] || 'Full Time'}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-brand-600">
                      <Users className="h-3 w-3" /> {ranked.length} applicants
                    </span>
                  </div>
                </div>
                {/* Top match preview */}
                {topApplicant && (
                  <div className="hidden flex-none items-center gap-2 sm:flex">
                    <div className="flex items-center gap-1.5 rounded-lg bg-accent-50 px-2.5 py-1.5">
                      <Trophy className="h-3.5 w-3.5 text-accent-600" />
                      <span className="text-xs font-bold text-accent-700">{topApplicant.matchPercent}%</span>
                      <span className="text-xs text-slate-500">top match</span>
                    </div>
                  </div>
                )}
                <ChevronDown
                  className={`h-5 w-5 flex-none text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Expanded: Smart Match Ranker */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-4 sm:p-5 animate-fadeIn">
                  {/* Job requirements summary */}
                  <div className="mb-4 rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-brand-600" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Job Core Skills</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {jobSkills.length > 0 ? (
                        jobSkills.map((s) => (
                          <span key={s} className="tag bg-white text-brand-700 ring-1 ring-brand-200">{s}</span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No specific skills detected — ranking by general fit.</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      {truncate(stripHtml(job.description), 180)}
                    </p>
                  </div>

                  {/* Ranked applicants */}
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <TrendingUp className="h-4 w-4 text-brand-600" /> Smart Match Ranking
                    </span>
                    <span className="text-xs text-slate-400">Sorted by AI match score</span>
                  </div>

                  <div className="space-y-2.5">
                    {ranked.map((app, idx) => (
                      <ApplicantCard key={app.id} applicant={app} rank={idx + 1} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ApplicantCard({ applicant, rank }: { applicant: RankedApplicant; rank: number }) {
  const tierStyles: Record<RankedApplicant['tier'], { badge: string; bar: string; ring: string; label: string }> = {
    top: {
      badge: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
      bar: 'bg-gradient-to-r from-accent-500 to-accent-600',
      ring: 'ring-2 ring-amber-300',
      label: 'Top Tier',
    },
    strong: {
      badge: 'bg-brand-600 text-white',
      bar: 'bg-brand-500',
      ring: 'ring-1 ring-brand-200',
      label: 'Strong Match',
    },
    fair: {
      badge: 'bg-slate-200 text-slate-600',
      bar: 'bg-slate-400',
      ring: 'ring-1 ring-slate-200',
      label: 'Fair Match',
    },
    weak: {
      badge: 'bg-slate-100 text-slate-400',
      bar: 'bg-slate-300',
      ring: '',
      label: 'Weak Match',
    },
  }

  const tier = tierStyles[applicant.tier]
  const isTop = applicant.tier === 'top'

  return (
    <div
      className={`relative rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:shadow-card ${tier.ring} ${
        isTop ? 'border-amber-300 bg-gradient-to-br from-amber-50/40 to-white' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Rank number */}
        <div className="flex flex-none flex-col items-center gap-1">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              rank === 1 ? 'bg-amber-400 text-white' : rank === 2 ? 'bg-slate-400 text-white' : rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {rank}
          </div>
          {isTop && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
        </div>

        {/* Avatar + info */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-slate-100 text-xl">
            {applicant.avatar_emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate font-semibold text-slate-900">{applicant.name}</h4>
              <span className={`tag flex-none ${tier.badge}`}>
                {isTop && <Trophy className="mr-1 h-3 w-3" />}
                {tier.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {applicant.major} · {applicant.university}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-400">{applicant.tagline}</p>
          </div>
        </div>

        {/* Match score */}
        <div className="flex flex-none flex-col items-end gap-1">
          <span className={`text-2xl font-extrabold leading-none ${isTop ? 'text-accent-600' : 'text-slate-700'}`}>
            {applicant.matchPercent}%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Match</span>
        </div>
      </div>

      {/* Match score bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${tier.bar}`}
          style={{ width: `${applicant.matchPercent}%` }}
        />
      </div>

      {/* Tech stack */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {applicant.tech_stack.map((t) => {
          const isMatched = applicant.matchedSkills.some((m) => m.toLowerCase() === t.toLowerCase())
          return (
            <span
              key={t}
              className={`tag ${isMatched ? 'bg-accent-50 text-accent-700' : 'bg-slate-100 text-slate-500'}`}
            >
              {isMatched && <Check className="mr-1 h-3 w-3" />}
              {t}
            </span>
          )
        })}
      </div>

      {/* Project preview */}
      <div className="mt-3 rounded-lg bg-slate-50 p-2.5">
        <div className="flex items-center gap-1.5">
          <BadgeCheck className="h-3.5 w-3.5 text-brand-500" />
          <span className="text-xs font-semibold text-slate-700">{applicant.project_title}</span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{applicant.project_desc}</p>
      </div>

      {/* Match breakdown */}
      {applicant.matchedSkills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
          <span className="text-accent-600">
            ✓ {applicant.matchedSkills.length} skill{applicant.matchedSkills.length !== 1 ? 's' : ''} matched
          </span>
          {applicant.missingSkills.length > 0 && (
            <span className="text-slate-400">
              {applicant.missingSkills.length} gap{applicant.missingSkills.length !== 1 ? 's' : ''}: {applicant.missingSkills.slice(0, 3).join(', ')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
