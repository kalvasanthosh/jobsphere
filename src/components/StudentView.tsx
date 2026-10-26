import { useEffect, useState } from 'react'
import { supabase, type StudentProfile, type PortfolioProject } from '../lib/supabase'
import { generateBullets } from '../lib/resumeOptimizer'
import {
  Sparkles,
  Wand,
  Loader,
  Copy,
  Check,
  BadgeCheck,
  Plus,
  Trash,
  Link,
  GraduationCap,
} from './icons'

const TECH_OPTIONS = [
  'React', 'TypeScript', 'Tailwind CSS', 'Python', 'Node.js',
  'Next.js', 'Supabase', 'PostgreSQL', 'FastAPI', 'Vite', 'OpenAI',
]

export function StudentView() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const [draft, setDraft] = useState<StudentProfile | null>(null)

  const [descInput, setDescInput] = useState('')
  const [bullets, setBullets] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const [showAddProject, setShowAddProject] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    project_url: '',
    tech_stack: [] as string[],
  })

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: profiles }, { data: projs }] = await Promise.all([
      supabase.from('student_profiles').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('portfolio_projects').select('*').order('created_at', { ascending: false }),
    ])
    setProfile(profiles as StudentProfile | null)
    setDraft(profiles as StudentProfile | null)
    setProjects((projs as PortfolioProject[]) ?? [])
    setLoading(false)
  }

  async function saveProfile() {
    if (!draft) return
    setSavingProfile(true)
    setProfileSaved(false)
    const payload = {
      name: draft.name,
      major: draft.major,
      university: draft.university,
      project_links: draft.project_links,
      avatar_emoji: draft.avatar_emoji,
      tagline: draft.tagline,
      updated_at: new Date().toISOString(),
    }
    if (draft.id) {
      await supabase.from('student_profiles').update(payload).eq('id', draft.id)
    } else {
      const { data } = await supabase.from('student_profiles').insert(payload).select('*').maybeSingle()
      if (data) {
        setProfile(data as StudentProfile)
        setDraft(data as StudentProfile)
      }
    }
    setProfile(draft)
    setSavingProfile(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2200)
  }

  function handleGenerate() {
    if (!descInput.trim()) return
    setGenerating(true)
    setBullets([])
    // Simulate AI processing delay for UX
    setTimeout(() => {
      setBullets(generateBullets(descInput))
      setGenerating(false)
    }, 850)
  }

  function copyBullet(idx: number) {
    if (!bullets[idx]) return
    navigator.clipboard?.writeText(bullets[idx])
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1600)
  }

  async function addProject() {
    if (!newProject.title.trim() || !profile) return
    const payload = {
      title: newProject.title.trim(),
      description: newProject.description.trim(),
      tech_stack: newProject.tech_stack,
      project_url: newProject.project_url.trim(),
      verified: false,
      student_profile_id: profile.id,
    }
    const { data } = await supabase.from('portfolio_projects').insert(payload).select('*').maybeSingle()
    if (data) {
      setProjects((prev) => [data as PortfolioProject, ...prev])
      setNewProject({ title: '', description: '', project_url: '', tech_stack: [] })
      setShowAddProject(false)
    }
  }

  async function deleteProject(id: string) {
    await supabase.from('portfolio_projects').delete().eq('id', id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  async function toggleVerified(project: PortfolioProject) {
    const { data } = await supabase
      .from('portfolio_projects')
      .update({ verified: !project.verified })
      .eq('id', project.id)
      .select('*')
      .maybeSingle()
    if (data) {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? (data as PortfolioProject) : p)))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <section className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500" />
        <div className="px-5 pb-5 sm:px-6">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-white text-4xl shadow-card">
                {draft?.avatar_emoji || '🎓'}
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{draft?.name || 'Your name'}</h2>
                <p className="text-sm text-slate-500">
                  {draft?.major ? draft.major : 'Add your major'} • {draft?.university ? draft.university : 'Add your university'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {profileSaved && (
                <span className="flex items-center gap-1.5 rounded-lg bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-700 animate-popIn">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )}
              <button onClick={saveProfile} disabled={savingProfile} className="btn-primary">
                {savingProfile ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save profile
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input
                value={draft?.name ?? ''}
                onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                placeholder="Alex Rivera"
                className="input"
              />
            </Field>
            <Field label="Major">
              <input
                value={draft?.major ?? ''}
                onChange={(e) => setDraft((d) => (d ? { ...d, major: e.target.value } : d))}
                placeholder="Computer Science"
                className="input"
              />
            </Field>
            <Field label="University">
              <input
                value={draft?.university ?? ''}
                onChange={(e) => setDraft((d) => (d ? { ...d, university: e.target.value } : d))}
                placeholder="State University"
                className="input"
              />
            </Field>
            <Field label="Project links (GitHub, portfolio)">
              <input
                value={draft?.project_links ?? ''}
                onChange={(e) => setDraft((d) => (d ? { ...d, project_links: e.target.value } : d))}
                placeholder="github.com/alexrivera"
                className="input"
              />
            </Field>
          </div>
        </div>
      </section>

      {/* AI Resume Optimizer */}
      <section className="card relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-100/60 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Resume Bullet Optimizer</h3>
              <p className="text-sm text-slate-500">
                Describe a project or club activity casually — get polished, metrics-driven bullets.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <textarea
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              rows={3}
              placeholder="e.g. I made a food ordering app for my campus dining hall with my roommates, it got used by a bunch of students and we tracked orders live."
              className="input resize-none"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">{descInput.trim() ? `${descInput.trim().split(/\s+/).length} words` : 'Tip: include details like team size, users, or impact'}</span>
              <button onClick={handleGenerate} disabled={!descInput.trim() || generating} className="btn-primary">
                {generating ? <Loader className="h-4 w-4 animate-spin" /> : <Wand className="h-4 w-4" />}
                {generating ? 'Generating…' : 'Generate bullets'}
              </button>
            </div>
          </div>

          {bullets.length > 0 && (
            <div className="mt-5 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
                <BadgeCheck className="h-4 w-4" /> Suggested resume bullets
              </div>
              {bullets.map((b, i) => (
                <div
                  key={i}
                  className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm leading-relaxed text-slate-700">{b}</p>
                  <button
                    onClick={() => copyBullet(i)}
                    className="flex-none rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-white hover:text-brand-600 group-hover:opacity-100"
                    aria-label="Copy bullet"
                  >
                    {copiedIdx === i ? <Check className="h-4 w-4 text-accent-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Portfolio showcase */}
      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Portfolio Showcase</h3>
              <p className="text-sm text-slate-500">Verified projects with tech stack tags.</p>
            </div>
          </div>
          <button onClick={() => setShowAddProject((s) => !s)} className="btn-ghost">
            <Plus className="h-4 w-4" /> Add project
          </button>
        </div>

        {showAddProject && (
          <div className="mt-4 space-y-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4 animate-popIn">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Project title">
                <input value={newProject.title} onChange={(e) => setNewProject((p) => ({ ...p, title: e.target.value }))} placeholder="CampusEat" className="input" />
              </Field>
              <Field label="Project URL">
                <input value={newProject.project_url} onChange={(e) => setNewProject((p) => ({ ...p, project_url: e.target.value }))} placeholder="github.com/you/project" className="input" />
              </Field>
            </div>
            <Field label="Short description">
              <input value={newProject.description} onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))} placeholder="A food-ordering PWA for campus dining halls." className="input" />
            </Field>
            <TechPicker selected={newProject.tech_stack} onToggle={(t) => setNewProject((p) => ({ ...p, tech_stack: toggleTech(p.tech_stack, t) }))} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddProject(false)} className="btn-ghost">Cancel</button>
              <button onClick={addProject} disabled={!newProject.title.trim()} className="btn-primary">
                <Plus className="h-4 w-4" /> Add to portfolio
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <div key={p.id} className="group relative rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cardhover">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-slate-900">{p.title}</h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleVerified(p)}
                    className={`tag transition-colors ${
                      p.verified
                        ? 'bg-accent-50 text-accent-700 hover:bg-accent-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    title="Toggle verified"
                  >
                    <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                    {p.verified ? 'Verified' : 'Unverified'}
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{p.description}</p>
              {p.tech_stack.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tech_stack.map((t) => (
                    <span key={t} className="tag bg-brand-50 text-brand-700">{t}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                {p.project_url ? (
                  <a
                    href={`https://${p.project_url.replace(/^https?:\/\//, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <Link className="h-3.5 w-3.5" /> {p.project_url}
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">No link</span>
                )}
                <button
                  onClick={() => deleteProject(p.id)}
                  className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  aria-label="Delete project"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-slate-400">
              No projects yet — add your first portfolio project above.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function TechPicker({ selected, onToggle }: { selected: string[]; onToggle: (t: string) => void }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tech stack</span>
      <div className="flex flex-wrap gap-1.5">
        {TECH_OPTIONS.map((t) => {
          const active = selected.includes(t)
          return (
            <button
              key={t}
              type="button"
              onClick={() => onToggle(t)}
              className={`tag transition-all duration-150 ${
                active
                  ? 'bg-brand-600 text-white hover:bg-brand-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function toggleTech(arr: string[], t: string): string[] {
  return arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]
}
