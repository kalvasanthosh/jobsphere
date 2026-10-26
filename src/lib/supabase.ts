import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type StudentProfile = {
  id: string
  name: string
  major: string
  university: string
  project_links: string
  avatar_emoji: string
  tagline: string
  updated_at: string
}

export type PortfolioProject = {
  id: string
  title: string
  description: string
  tech_stack: string[]
  project_url: string
  verified: boolean
  student_profile_id: string | null
  created_at: string
}

export type Job = {
  id: string
  role_title: string
  company_name: string
  company_logo: string
  stipend: string
  location: string
  description: string
  requirements: string[]
  job_type: string
  created_at: string
}

export type Application = {
  id: string
  job_id: string
  student_profile_id: string | null
  applied_at: string
}
