/*
# Create SkillLaunch schema (single-tenant, no auth)

1. New Tables
- `student_profiles`: a single student profile (name, major, university, project links, avatar emoji).
- `portfolio_projects`: showcase projects with title, description, tech stack tags, link, and a verified flag.
- `jobs`: entry-level roles and internships posted by companies (role, company, stipend, location, description, requirements checklist).
- `applications`: mock applications linking a student to a job with an applied timestamp.

2. Security
- Enable RLS on every table.
- Grant CRUD to `anon` + `authenticated` (intentionally public/shared demo data, no sign-in).
- Permissive policies (`USING (true)`) are acceptable here because this is a single-tenant demo app with no authentication and shared public data.

3. Important Notes
- No `user_id` / `auth.users` foreign keys — there is no sign-in screen.
- `tech_stack` and `requirements` are stored as `text[]` arrays.
- `applications` has a unique constraint on `(job_id, student_profile_id)` so a student cannot apply to the same job twice.
*/

CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  major text NOT NULL DEFAULT '',
  university text NOT NULL DEFAULT '',
  project_links text NOT NULL DEFAULT '',
  avatar_emoji text NOT NULL DEFAULT '🎓',
  tagline text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  tech_stack text[] NOT NULL DEFAULT '{}',
  project_url text NOT NULL DEFAULT '',
  verified boolean NOT NULL DEFAULT false,
  student_profile_id uuid REFERENCES student_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title text NOT NULL,
  company_name text NOT NULL,
  company_logo text NOT NULL DEFAULT '🏢',
  stipend text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  description text NOT NULL,
  requirements text[] NOT NULL DEFAULT '{}',
  job_type text NOT NULL DEFAULT 'Internship',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  student_profile_id uuid REFERENCES student_profiles(id) ON DELETE CASCADE,
  applied_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT one_application_per_job_student UNIQUE (job_id, student_profile_id)
);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON student_profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio_projects TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON jobs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON applications TO anon, authenticated;

-- student_profiles policies
DROP POLICY IF EXISTS "anon_select_profiles" ON student_profiles;
CREATE POLICY "anon_select_profiles" ON student_profiles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profiles" ON student_profiles;
CREATE POLICY "anon_insert_profiles" ON student_profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profiles" ON student_profiles;
CREATE POLICY "anon_update_profiles" ON student_profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profiles" ON student_profiles;
CREATE POLICY "anon_delete_profiles" ON student_profiles FOR DELETE
  TO anon, authenticated USING (true);

-- portfolio_projects policies
DROP POLICY IF EXISTS "anon_select_projects" ON portfolio_projects;
CREATE POLICY "anon_select_projects" ON portfolio_projects FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_projects" ON portfolio_projects;
CREATE POLICY "anon_insert_projects" ON portfolio_projects FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_projects" ON portfolio_projects;
CREATE POLICY "anon_update_projects" ON portfolio_projects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_projects" ON portfolio_projects;
CREATE POLICY "anon_delete_projects" ON portfolio_projects FOR DELETE
  TO anon, authenticated USING (true);

-- jobs policies
DROP POLICY IF EXISTS "anon_select_jobs" ON jobs;
CREATE POLICY "anon_select_jobs" ON jobs FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_jobs" ON jobs;
CREATE POLICY "anon_insert_jobs" ON jobs FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_jobs" ON jobs;
CREATE POLICY "anon_update_jobs" ON jobs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_jobs" ON jobs;
CREATE POLICY "anon_delete_jobs" ON jobs FOR DELETE
  TO anon, authenticated USING (true);

-- applications policies
DROP POLICY IF EXISTS "anon_select_applications" ON applications;
CREATE POLICY "anon_select_applications" ON applications FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_applications" ON applications;
CREATE POLICY "anon_insert_applications" ON applications FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_applications" ON applications;
CREATE POLICY "anon_update_applications" ON applications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_applications" ON applications;
CREATE POLICY "anon_delete_applications" ON applications FOR DELETE
  TO anon, authenticated USING (true);

-- Seed: default student profile
INSERT INTO student_profiles (name, major, university, project_links, avatar_emoji, tagline)
SELECT 'Alex Rivera', 'Computer Science', 'State University', 'github.com/alexrivera', '🎓', 'Building things that ship.'
WHERE NOT EXISTS (SELECT 1 FROM student_profiles);

-- Seed: portfolio projects
INSERT INTO portfolio_projects (title, description, tech_stack, project_url, verified, student_profile_id)
SELECT 'CampusEat', 'A food-ordering PWA for campus dining halls with live order tracking and a 4.5★ student rating.', ARRAY['React', 'Tailwind', 'Supabase'], 'github.com/alexrivera/campuseat', true, (SELECT id FROM student_profiles LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM portfolio_projects);

INSERT INTO portfolio_projects (title, description, tech_stack, project_url, verified, student_profile_id)
SELECT 'GradeSync', 'Automated GPA calculator that pulls course data and visualizes semester trends.', ARRAY['Python', 'FastAPI', 'React'], 'github.com/alexrivera/gradesync', true, (SELECT id FROM student_profiles LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM portfolio_projects WHERE title = 'GradeSync');

INSERT INTO portfolio_projects (title, description, tech_stack, project_url, verified, student_profile_id)
SELECT 'EchoNotes', 'AI-powered lecture summarizer that turns audio into structured study guides.', ARRAY['TypeScript', 'OpenAI', 'Next.js'], 'github.com/alexrivera/echonotes', false, (SELECT id FROM student_profiles LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM portfolio_projects WHERE title = 'EchoNotes');

-- Seed: jobs
INSERT INTO jobs (role_title, company_name, company_logo, stipend, location, description, requirements, job_type)
SELECT 'Frontend Engineer Intern', 'Lumen Labs', '🚀', '$6,500 / mo', 'Remote (US)', 'Join our design systems team to build accessible React components used by 200k+ users. You will own a feature end-to-end and ship to production in your first week.', ARRAY['React', 'TypeScript', 'Tailwind CSS', 'GitHub portfolio link'], 'Internship'
WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE role_title = 'Frontend Engineer Intern');

INSERT INTO jobs (role_title, company_name, company_logo, stipend, location, description, requirements, job_type)
SELECT 'Backend Engineering Intern', 'Paylink', '💳', '$7,200 / mo', 'San Francisco, CA', 'Help scale our payments API handling 1M requests/day. Work on auth flows, idempotency, and observability alongside senior engineers.', ARRAY['Python', 'PostgreSQL', 'REST APIs', 'GitHub portfolio link'], 'Internship'
WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE role_title = 'Backend Engineering Intern');

INSERT INTO jobs (role_title, company_name, company_logo, stipend, location, description, requirements, job_type)
SELECT 'Junior Full-Stack Developer', 'Northwind', '⛰️', '$85,000 / yr', 'Austin, TX', 'Build customer-facing features across our SaaS dashboard. Full-stack role with mentorship and a clear path to mid-level within 18 months.', ARRAY['React', 'Node.js', 'Tailwind CSS', 'GitHub portfolio link'], 'Full-time'
WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE role_title = 'Junior Full-Stack Developer');

INSERT INTO jobs (role_title, company_name, company_logo, stipend, location, description, requirements, job_type)
SELECT 'Data Engineering Intern', 'Streamly', '📊', '$6,000 / mo', 'Remote', 'Design ETL pipelines for our streaming analytics platform. Great opportunity for students strong in SQL and Python.', ARRAY['Python', 'SQL', 'Pandas', 'GitHub portfolio link'], 'Internship'
WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE role_title = 'Data Engineering Intern');
