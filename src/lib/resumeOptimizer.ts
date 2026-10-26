/**
 * Deterministic "AI Resume Bullet Optimizer" — generates metrics-driven
 * resume bullet points from a casual project/activity description.
 * No external API key required; produces professional, action-verb-led,
 * quantified bullets. Mock intelligence for demo purposes.
 */

type Bullet = string

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function deriveMetrics(text: string): string[] {
  const lower = text.toLowerCase()
  const metrics: string[] = []

  const hasUsers = /(user|customer|student|visitor|player|client)/.test(lower)
  const hasTeam = /(team|group|club|committee|society)/.test(lower)
  const hasMoney = /(fund|raise|budget|revenue|sale|sponsor)/.test(lower)
  const hasTime = /(week|month|quarter|semester|sprint|deadline)/.test(lower)
  const hasData = /(data|dataset|record|row|query|model|train)/.test(lower)
  const hasBuild = /(build|develop|create|design|ship|launch|deploy|implement)/.test(lower)
  const hasImprove = /(improve|optimize|faster|reduce|increase|speed|latency|performance)/.test(lower)

  if (hasUsers) metrics.push('serving 500+ active users')
  if (hasTeam) metrics.push('coordinating a 12-person team')
  if (hasMoney) metrics.push('raising $4,200 in sponsorships')
  if (hasData) metrics.push('processing 50,000+ records')
  if (hasImprove) metrics.push('reducing load times by 35%')
  if (hasBuild && metrics.length === 0) metrics.push('shipping 3 production features')
  if (hasTime && metrics.length < 2) metrics.push('within a 2-week sprint')

  if (metrics.length === 0) {
    metrics.push('delivering measurable impact')
    metrics.push('across a 6-week timeline')
  }
  return metrics
}

function detectRole(text: string): string {
  const lower = text.toLowerCase()
  if (/(club|society|committee|event|organize|outreach|volunteer)/.test(lower)) return 'Led'
  if (/(research|paper|study|analyze|model|experiment)/.test(lower)) return 'Researched'
  if (/(design|ui|ux|figma|prototype|wireframe)/.test(lower)) return 'Designed'
  if (/(data|dataset|pipeline|etl|query|sql)/.test(lower)) return 'Engineered'
  if (/(build|develop|code|app|website|api|deploy)/.test(lower)) return 'Developed'
  return 'Spearheaded'
}

function detectArea(text: string): string {
  const lower = text.toLowerCase()
  if (/(club|society|committee)/.test(lower)) return 'a campus organization initiative'
  if (/(research|paper|study)/.test(lower)) return 'an independent research project'
  if (/(app|website|web|dashboard|platform)/.test(lower)) return 'a full-stack web application'
  if (/(api|backend|service|pipeline)/.test(lower)) return 'a backend service'
  if (/(design|ui|ux|prototype)/.test(lower)) return 'a product design system'
  return 'a technical project'
}

export function generateBullets(description: string): Bullet[] {
  const text = description.trim()
  if (!text) return []

  const seed = countWords(text) + text.length
  const role = detectRole(text)
  const area = detectArea(text)
  const metrics = deriveMetrics(text)

  const bulletOne = `${role} ${area} ${metrics[0]}, ${metrics[1] ?? 'improving overall efficiency'}; collaborated cross-functionally to define scope and deliver on time.`

  const secondVerbs = ['Automated', 'Optimized', 'Architected', 'Streamlined', 'Scaled']
  const secondOutcomes = [
    'improving reliability and reducing manual effort by 40%',
    'boosting engagement metrics by 25% in the first month',
    'cutting average response time from 800ms to under 300ms',
    'increasing user retention by 18% post-launch',
  ]

  const bulletTwo = `${pick(secondVerbs, seed + 1)} core workflows using ${pick(
    ['React', 'TypeScript', 'Python', 'Tailwind CSS', 'PostgreSQL'],
    seed + 2,
  )} and ${pick(['Supabase', 'FastAPI', 'Node.js', 'Vite'], seed + 3)}, ${pick(
    secondOutcomes,
    seed + 4,
  )}.`

  return [bulletOne, bulletTwo]
}
