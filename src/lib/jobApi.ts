export type ApiJob = {
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

export function emojiForCompany(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return COMPANY_EMOJIS[Math.abs(hash) % COMPANY_EMOJIS.length]
}

export function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim()
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

export function timeAgo(unix: number): string {
  const diff = Date.now() / 1000 - unix
  const days = Math.floor(diff / 86400)
  if (days >= 1) return `${days}d ago`
  const hours = Math.floor(diff / 3600)
  if (hours >= 1) return `${hours}h ago`
  const mins = Math.floor(diff / 60)
  return mins >= 1 ? `${mins}m ago` : 'just now'
}

/**
 * Extract a normalized country from a free-text location string.
 * Falls back to the raw location if no country is recognized.
 */
const COUNTRY_MAP: { match: RegExp; country: string }[] = [
  { match: /germany|deutschland|berlin|münchen|munich|cologne|köln|hamburg|frankfurt|dusseldorf|stuttgart|dresden|leipzig|bremen/i, country: 'Germany' },
  { match: /netherlands|nederland|amsterdam|rotterdam|utrecht|apeldoorn|noord-holland/i, country: 'Netherlands' },
  { match: /france|paris|bordeaux|lyon|nantes|grenoble|sophia antipolis|belfort|bourgogne/i, country: 'France' },
  { match: /switzerland|schweiz|suisse|zurich|zürich|geneva|basel|bern|lausanne|schwyz|blonay|baden/i, country: 'Switzerland' },
  { match: /united kingdom|\buk\b|london|belfast|northern ireland|england|scotland|wales|manchester|edinburgh/i, country: 'United Kingdom' },
  { match: /spain|españa|barcelona|madrid|valencia|seville|malaga/i, country: 'Spain' },
  { match: /portugal|lisbon|lisboa|porto/i, country: 'Portugal' },
  { match: /ireland|dublin|cork|galway/i, country: 'Ireland' },
  { match: /austria|österreich|vienna|wien|salzburg|graz|innsbruck|linz/i, country: 'Austria' },
  { match: /poland|polska|warsaw|warszawa|krakow|gdansk|wroclaw/i, country: 'Poland' },
  { match: /sweden|sverige|stockholm|gothenburg|malmo|malmö/i, country: 'Sweden' },
  { match: /denmark|danmark|copenhagen|københavn|aarhus/i, country: 'Denmark' },
  { match: /norway|norge|oslo|bergen|trondheim/i, country: 'Norway' },
  { match: /finland|suomi|helsinki|tampere|turku/i, country: 'Finland' },
  { match: /italy|italia|milan|rome|roma|turin|torino|napoli/i, country: 'Italy' },
  { match: /belgium|belgië|belgique|brussels|bruxelles|brugge|ghent|antwerp/i, country: 'Belgium' },
  { match: /czech|prague|praha|brno/i, country: 'Czech Republic' },
  { match: /estonia|tallinn|tartu/i, country: 'Estonia' },
  { match: /latvia|riga/i, country: 'Latvia' },
  { match: /lithuania|vilnius|kaunas/i, country: 'Lithuania' },
  { match: /greece|athens|thessaloniki/i, country: 'Greece' },
  { match: /romania|bucharest|cluj/i, country: 'Romania' },
  { match: /hungary|budapest/i, country: 'Hungary' },
  { match: /canada|toronto|vancouver|montreal|calgary|ottawa/i, country: 'Canada' },
  { match: /usa|united states|\bus\b|new york|san francisco|seattle|austin|boston|chicago|remote us/i, country: 'USA' },
  { match: /remote/i, country: 'Remote' },
]

export function extractCountry(location: string): string {
  if (!location.trim()) return 'Unspecified'
  for (const { match, country } of COUNTRY_MAP) {
    if (match.test(location)) return country
  }
  return 'Other'
}

/**
 * Classify a job into a broad domain bucket based on its tags + title.
 */
const DOMAIN_RULES: { domain: string; patterns: RegExp[] }[] = [
  { domain: 'Engineering', patterns: [/engineering|backend|frontend|full.?stack|software|developer|engineer/i] },
  { domain: 'Data', patterns: [/data|analytics|machine learning|\bml\b|\bai\b|scientist|algorithm/i] },
  { domain: 'Design', patterns: [/design|ux|ui|grafik|graphic|creative/i] },
  { domain: 'Product', patterns: [/product|owner|manager.*product/i] },
  { domain: 'Marketing', patterns: [/marketing|growth|seo|content|social media|communication/i] },
  { domain: 'Sales', patterns: [/sales|account|business development|revenue/i] },
  { domain: 'Operations', patterns: [/operations|ops|logistics|supply chain|process|scheduler/i] },
  { domain: 'Finance', patterns: [/finance|accounting|controlling|tax|audit/i] },
  { domain: 'Customer Service', patterns: [/customer|support|success|service/i] },
  { domain: 'Management', patterns: [/manager|team leader|lead|head of|director|chief/i] },
  { domain: 'IT & Security', patterns: [/it security|sysadmin|network|infrastructure|devops|system/i] },
  { domain: 'Research', patterns: [/research|r&d|scientist|lab/i] },
]

export function extractDomain(job: ApiJob): string {
  const haystack = `${job.title} ${job.tags.join(' ')}`
  for (const { domain, patterns } of DOMAIN_RULES) {
    if (patterns.some((p) => p.test(haystack))) return domain
  }
  return 'Other'
}

/**
 * Estimate a salary band from job title/tags.
 * The Arbeitnow API does not expose salary directly, so we derive a
 * plausible band from seniority + role type for filtering purposes.
 */
const SENIORITY_HIGH = /senior|lead|staff|principal|head of|director|chief/i
const SENIORITY_MID = /mid|experienced|specialist/i
const SENIORITY_ENTRY = /junior|intern|trainee|entry|graduate/i

export type SalaryBand = { min: number; max: number; label: string }

export function estimateSalary(job: ApiJob): SalaryBand {
  const isFullTime = job.job_types.some((t) => t.toLowerCase().includes('full'))
  const title = job.title

  let base = 45000
  if (SENIORITY_HIGH.test(title)) base = 95000
  else if (SENIORITY_MID.test(title)) base = 70000
  else if (SENIORITY_ENTRY.test(title)) base = 40000
  else if (/engineer|developer|data|ai|ml/i.test(title)) base = 65000

  // Internships / non-full-time get monthly-equivalent stipend
  if (!isFullTime || /intern|trainee/i.test(title)) {
    const monthly = Math.round(base / 12 / 1000) * 1000
    return { min: monthly * 12, max: (monthly + 2000) * 12, label: `$${(monthly).toLocaleString()}/mo est.` }
  }

  const max = Math.round((base * 1.35) / 1000) * 1000
  return { min: base, max, label: `$${(base / 1000).toFixed(0)}k–$${(max / 1000).toFixed(0)}k est.` }
}

export const SALARY_RANGES: { key: string; label: string; min: number; max: number }[] = [
  { key: 'all', label: 'Any salary', min: 0, max: Infinity },
  { key: '0-50', label: 'Up to $50k', min: 0, max: 50000 },
  { key: '50-80', label: '$50k – $80k', min: 50000, max: 80000 },
  { key: '80-120', label: '$80k – $120k', min: 80000, max: 120000 },
  { key: '120+', label: '$120k+', min: 120000, max: Infinity },
]

export async function fetchJobs(): Promise<ApiJob[]> {
  const res = await fetch(API_URL)
  if (!res.ok) throw new Error(`API returned ${res.status}`)
  const json = await res.json()
  return (json.data ?? []) as ApiJob[]
}

export function buildRequirements(job: ApiJob): string[] {
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

/** Core tech skills derived from a job for match scoring. */
export function extractJobSkills(job: ApiJob): string[] {
  const skills = new Set<string>()
  const text = `${job.title} ${job.tags.join(' ')} ${job.description}`.toLowerCase()

  const SKILL_MAP: { skill: string; patterns: string[] }[] = [
    { skill: 'React', patterns: ['react'] },
    { skill: 'TypeScript', patterns: ['typescript', 'ts'] },
    { skill: 'JavaScript', patterns: ['javascript', 'js', 'node'] },
    { skill: 'Python', patterns: ['python', 'django', 'flask'] },
    { skill: 'Node.js', patterns: ['node', 'express'] },
    { skill: 'Java', patterns: ['java', 'spring'] },
    { skill: 'Go', patterns: ['golang', ' go '] },
    { skill: 'Rust', patterns: ['rust'] },
    { skill: 'AWS', patterns: ['aws', 'kubernetes', 'terraform'] },
    { skill: 'SQL', patterns: ['sql', 'postgres', 'mysql'] },
    { skill: 'Data', patterns: ['data', 'analytics', 'etl', 'pipeline'] },
    { skill: 'Machine Learning', patterns: ['machine learning', 'ml', 'ai', 'llm'] },
    { skill: 'Design', patterns: ['design', 'figma', 'ux', 'ui'] },
    { skill: 'Marketing', patterns: ['marketing', 'seo', 'growth'] },
    { skill: 'Sales', patterns: ['sales', 'business development'] },
    { skill: 'Product', patterns: ['product', 'roadmap'] },
    { skill: 'Operations', patterns: ['operations', 'logistics'] },
  ]

  for (const { skill, patterns } of SKILL_MAP) {
    if (patterns.some((p) => text.includes(p))) skills.add(skill)
  }
  return Array.from(skills)
}
