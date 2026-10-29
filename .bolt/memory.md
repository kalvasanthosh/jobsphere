# Project memory

## Product intent & audience

- Student-to-employer recruitment platform connecting students with companies via job listings and applications.
- Two primary user types: students (portfolio builders / job seekers) and recruiters/employers (candidate evaluators).
- Core features: student portfolio with AI resume bullet optimizer, company job board, interactive application system, AI candidate ranking.

## Brand personality & voice

- Modern, professional, tech-forward — positioned as a smart/AI-enhanced platform for student recruitment.
- Emphasis on clarity and data-driven candidate insights (match percentages, skill alignment).

## Visual design & UX direction

- Three-tab navigation: Student, Job Board, Recruiter.
- Filter bar pattern: dropdown selectors + text search + clear-all button with active filter count.
- Card-based layouts for job listings and applicant cards.
- Visual hierarchy for ranking: gold "Top Tier" badge, trophy icon, amber ring highlight for top candidates (85%+ match).
- Match score visualization: progress bar + percentage; matched skills shown green with checkmarks, gaps listed separately.
- Applicant card contents: avatar, university, major, tech stack tags, project preview, match score.
- Expandable job postings in recruiter view revealing ranked applicant list.
- Instant filter updates (client-side filtering).

## Decisions, constraints & rationale

- Job data sourced from live Arbeitnow API (shared across all three views).
- Country/location filter values auto-extracted from job location text (e.g., Germany, Netherlands, France).
- Domain classification inferred from job title and tags (Engineering, Data, Design, Marketing, Sales, Operations, etc.).
- Salary ranges estimated from seniority and role type — API doesn't expose salary directly. Ranges: ≤$50k, $50k–$80k, $80k–$120k, $120k+.
- Job type filter includes Full-time, Remote, Internship, Contract.
- AI match algorithm: compares applicant project tech stack against job's core required skills; multi-skill/full-stack applicants get bonus to rank above single-skill; experience level adds small boost.
- Applicant generation is deterministic per job, seeded by job slug — ensures stable rankings across refreshes.
- Tech stack: Vite + React + TypeScript.
- Shared helpers extracted: job API helper, AI match ranking logic, mock applicant generator.

## Open questions & assumptions

- Applicant data is currently mock-generated; real application/applicant data pipeline not yet defined.
- Salary estimation heuristic may need refinement as more job data is observed.
- Domain classification rules are heuristic; may misclassify edge-case job titles.
- No persistence or backend yet for recruiter actions (e.g., shortlisting, rejecting candidates).
- Authentication and user roles (student vs recruiter) not yet implemented.