import { Rocket } from './icons'

type View = 'student' | 'jobs' | 'recruiter'

const TABS: { key: View; label: string }[] = [
  { key: 'student', label: 'Student' },
  { key: 'jobs', label: 'Job Board' },
  { key: 'recruiter', label: 'Recruiter' },
]

export function Header({
  view,
  onChangeView,
}: {
  view: View
  onChangeView: (v: View) => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              SkillLaunch
            </span>
            <span className="hidden text-[11px] font-medium text-slate-400 sm:block">
              Student → Employer recruitment
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onChangeView(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 sm:px-4 ${
                view === tab.key
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

export type { View }
