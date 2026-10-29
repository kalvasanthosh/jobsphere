import { useState } from 'react'
import { Header, type View } from './components/Header'
import { StudentView } from './components/StudentView'
import { JobsView } from './components/JobsView'
import { RecruiterView } from './components/RecruiterView'

export default function App() {
  const [view, setView] = useState<View>('student')

  return (
    <div className="min-h-full">
      <Header view={view} onChangeView={setView} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div key={view} className="animate-fadeIn">
          {view === 'student' ? <StudentView /> : view === 'jobs' ? <JobsView /> : <RecruiterView />}
        </div>
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 sm:px-6">
        <p className="text-center text-xs text-slate-400">
          SkillLaunch — a demo recruitment platform. Live jobs via Arbeitnow. Data persists to your project database.
        </p>
      </footer>
    </div>
  )
}
