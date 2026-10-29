import type { ApiJob } from './jobApi'
import { extractJobSkills } from './jobApi'

export type Applicant = {
  id: string
  name: string
  avatar_emoji: string
  university: string
  major: string
  tagline: string
  tech_stack: string[]
  project_title: string
  project_desc: string
  experience_level: 'entry' | 'mid' | 'senior'
}

export type RankedApplicant = Applicant & {
  matchPercent: number
  matchedSkills: string[]
  missingSkills: string[]
  tier: 'top' | 'strong' | 'fair' | 'weak'
}

const FIRST_NAMES = ['Alex', 'Jordan', 'Sam', 'Maya', 'Liam', 'Priya', 'Noah', 'Emma', 'Diego', 'Sofia', 'Kai', 'Zara', 'Ethan', 'Aisha', 'Lucas', 'Nina', 'Omar', 'Grace', 'Yuki', 'Tomás']
const LAST_NAMES = ['Rivera', 'Chen', 'Patel', 'Müller', 'Okafor', 'Silva', 'Novak', 'Yamamoto', 'Andersson', 'Rossi', 'Khan', 'Lopez', 'Schmidt', 'Nguyen', 'Brown', 'Costa', 'Haaland', 'Petrova', 'Walsh', 'Dubois']
const UNIVERSITIES = ['TU Berlin', 'University of Amsterdam', 'ETH Zürich', 'Imperial College London', 'KTH Stockholm', 'Politecnico di Milano', 'University of Toronto', 'Sorbonne University', 'TU Munich', 'UC Dublin', 'University of Helsinki', 'Charles University Prague']
const EMOJIS = ['👩‍💻', '👨‍💻', '🧑‍💻', '👩‍🎓', '👨‍🎓', '🧑‍🎓', '👩‍🔬', '👨‍🔬', '🧑‍🎨', '👩‍🎨', '👨‍🎨', '🧑‍🔬']

const TECH_POOL = [
  'React', 'TypeScript', 'JavaScript', 'Python', 'Node.js', 'Java', 'Go', 'Rust',
  'AWS', 'SQL', 'Data', 'Machine Learning', 'Design', 'Marketing', 'Sales',
  'Product', 'Operations', 'Tailwind CSS', 'Next.js', 'FastAPI', 'PostgreSQL',
  'Docker', 'Kubernetes', 'GraphQL', 'Redis', 'Vite', 'Supabase',
]

const PROJECT_TEMPLATES = [
  { title: 'CampusEat', desc: 'A food-ordering PWA for campus dining halls with live order tracking.' },
  { title: 'GradeSync', desc: 'Automated GPA calculator that pulls course data and visualizes trends.' },
  { title: 'EchoNotes', desc: 'AI-powered lecture summarizer turning audio into structured study guides.' },
  { title: 'DevPulse', desc: 'A GitHub activity dashboard for open-source maintainers with commit analytics.' },
  { title: 'MarketMate', desc: 'A growth marketing automation tool with A/B test tracking and SEO scoring.' },
  { title: 'PipelineZero', desc: 'An ETL pipeline orchestrator for small data teams built on Python.' },
  { title: 'PixelForge', desc: 'A component design system generator exporting React + Tailwind kits.' },
  { title: 'SaleStream', desc: 'A CRM-lite for student-led startups with pipeline and revenue forecasting.' },
  { title: 'OpsBoard', desc: 'A lightweight operations dashboard for campus event logistics.' },
  { title: 'ModelForge', desc: 'A no-code ML training playground for tabular datasets.' },
  { title: 'CloudCheck', desc: 'An AWS cost-optimization scanner that flags idle resources.' },
  { title: 'GraphWeave', desc: 'A GraphQL gateway layering auth and caching over multiple REST APIs.' },
]

function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function pickSubset<T>(arr: T[], count: number, rng: () => number): T[] {
  const copy = [...arr]
  const result: T[] = []
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length)
    result.push(copy.splice(idx, 1)[0])
  }
  return result
}

/**
 * Deterministically generate a set of mock applicants for a given job.
 * The job slug seeds the generator so applicants stay stable across refreshes.
 * Some applicants are deliberately given tech stacks that overlap heavily
 * with the job's required skills (to produce high match scores), while
 * others are random (to produce variety in the ranking board).
 */
export function generateApplicants(job: ApiJob, count = 6): Applicant[] {
  const jobSkills = extractJobSkills(job)
  const seed = job.slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const rng = seededRandom(seed)

  const applicants: Applicant[] = []

  for (let i = 0; i < count; i++) {
    const name = `${pick(FIRST_NAMES, rng)} ${pick(LAST_NAMES, rng)}`
    const project = pick(PROJECT_TEMPLATES, rng)
    const level = i < 2 ? 'entry' : i < 4 ? (rng() > 0.5 ? 'entry' : 'mid') : (rng() > 0.4 ? 'mid' : 'senior')

    // Build tech stack: the first ~40% of applicants get heavy overlap with job skills,
    // the rest get a random subset for ranking variety.
    let tech: string[]
    if (i < Math.ceil(count * 0.4) && jobSkills.length > 0) {
      const overlapCount = Math.min(jobSkills.length, 2 + Math.floor(rng() * 2))
      const overlapped = jobSkills.slice(0, overlapCount)
      const extras = pickSubset(TECH_POOL.filter((t) => !overlapped.includes(t)), 1 + Math.floor(rng() * 2), rng)
      tech = [...overlapped, ...extras]
    } else {
      tech = pickSubset(TECH_POOL, 2 + Math.floor(rng() * 3), rng)
    }

    applicants.push({
      id: `${job.slug}-app-${i}`,
      name,
      avatar_emoji: pick(EMOJIS, rng),
      university: pick(UNIVERSITIES, rng),
      major: pick(['Computer Science', 'Software Engineering', 'Data Science', 'Information Systems', 'Design & HCI', 'Business Informatics'], rng),
      tagline: pick(['Building things that ship.', 'Curious problem solver.', 'Shipping fast, learning faster.', 'Full-stack tinkerer.', 'Data-driven builder.', 'Design-minded developer.'], rng),
      tech_stack: tech,
      project_title: project.title,
      project_desc: project.desc,
      experience_level: level,
    })
  }

  return applicants
}

/**
 * Calculate an AI match percentage between an applicant's tech stack
 * and a job's core required skills. Full-stack / multi-skill applicants
 * get a bonus so they rank above single-skill candidates.
 */
export function rankApplicants(job: ApiJob, applicants: Applicant[]): RankedApplicant[] {
  const jobSkills = extractJobSkills(job)
  // If the API job has no detectable skills, fall back to its tags
  const required = jobSkills.length > 0 ? jobSkills : job.tags.slice(0, 3)

  const ranked = applicants.map((app) => {
    const appSkills = app.tech_stack.map((s) => s.toLowerCase())
    const matchedSkills: string[] = []
    const missingSkills: string[] = []

    for (const req of required) {
      const reqLower = req.toLowerCase()
      const isMatch = appSkills.some((a) => a === reqLower || a.includes(reqLower) || reqLower.includes(a))
      if (isMatch) {
        matchedSkills.push(req)
      } else {
        missingSkills.push(req)
      }
    }

    // Base match = ratio of required skills the applicant has
    const baseRatio = required.length > 0 ? matchedSkills.length / required.length : 0.5

    // Multi-skill bonus: applicants with 4+ relevant skills get a boost (full-stack signal)
    const stackSize = app.tech_stack.length
    let stackBonus = 0
    if (stackSize >= 5) stackBonus = 0.12
    else if (stackSize >= 3) stackBonus = 0.06

    // Experience level bonus
    let expBonus = 0
    if (app.experience_level === 'mid') expBonus = 0.04
    if (app.experience_level === 'senior') expBonus = 0.08

    // Exact-skill-name match bonus (stronger than substring)
    const exactMatches = matchedSkills.filter((m) =>
      app.tech_stack.some((t) => t.toLowerCase() === m.toLowerCase()),
    )
    const exactBonus = exactMatches.length * 0.02

    let percent = (baseRatio * 100) + (stackBonus + expBonus + exactBonus) * 100
    percent = Math.min(99, Math.max(35, Math.round(percent)))

    let tier: RankedApplicant['tier']
    if (percent >= 85) tier = 'top'
    else if (percent >= 70) tier = 'strong'
    else if (percent >= 50) tier = 'fair'
    else tier = 'weak'

    return {
      ...app,
      matchPercent: percent,
      matchedSkills,
      missingSkills,
      tier,
    }
  })

  // Sort by match percentage descending
  ranked.sort((a, b) => b.matchPercent - a.matchPercent)
  return ranked
}
