/*
# Drop jobs foreign key on applications

## Why
The Job Board now fetches live listings from the Arbeitnow public API instead of reading from the local `jobs` table. Applications are keyed by the external job `slug` (e.g. "senior-product-engineer-berlin-253211"), which does not exist in the local `jobs` table. The existing foreign key constraint `applications.job_id → jobs.id` would reject every insert.

## Changes
1. Drop the `applications_job_id_fkey` foreign key constraint (if it exists).
2. Keep the `one_application_per_job_student` unique constraint so a student still can't apply to the same job slug twice.
3. No columns are dropped or renamed. The `jobs` table itself is left in place (no data loss) — it is simply no longer the source for the job board feed.

## Security
- No policy or grant changes. RLS stays enabled on all tables; the anon + authenticated CRUD policies remain as-is.
*/

ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_job_id_fkey;
