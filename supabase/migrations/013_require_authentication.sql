-- 013_require_authentication.sql
-- Tighten RLS on all user-data tables from "allow anyone" to "must be logged in."
-- This does NOT restrict by user_id — it only requires auth.uid() to be non-null
-- (i.e. a real authenticated session). The app is single-user so per-user row
-- filtering is not needed at this stage; this just closes the public anon hole.
--
-- DO NOT RUN until login has been confirmed working in the client — running this
-- first would lock the app out of its own data with no recovery except this dashboard.
--
-- Tables covered: all 16 user-data tables. conflict_rules and codex_entries
-- (permanent/seeded rows) get SELECT-only auth requirement; writes are still
-- blocked by the existing trigger for permanent rows.

-- ── Enable RLS where it wasn't already ──────────────────────────────────────
ALTER TABLE public.shadowtome_elixirs ENABLE ROW LEVEL SECURITY;

-- ── Drop the old "allow all" policies ───────────────────────────────────────
DROP POLICY IF EXISTS "Allow all access" ON public.user_profile;
DROP POLICY IF EXISTS "Allow all access" ON public.items;
DROP POLICY IF EXISTS "Allow all access" ON public.composite_components;
DROP POLICY IF EXISTS "Allow all access" ON public.somatic_reactions;
DROP POLICY IF EXISTS "Allow all access" ON public.shadowtome_elixirs;
DROP POLICY IF EXISTS "Allow all access" ON public.journal_entries;
DROP POLICY IF EXISTS "Allow all access" ON public.routine_history;
DROP POLICY IF EXISTS "Allow all access" ON public.appointments;
DROP POLICY IF EXISTS "Allow all access" ON public.isotretinoin_log;
DROP POLICY IF EXISTS "Allow all access" ON public.codex_entries;
DROP POLICY IF EXISTS "Allow all access" ON public.conflict_rules;

-- ── Create "must be authenticated" policies ──────────────────────────────────
CREATE POLICY "Authenticated users only" ON public.user_profile
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users only" ON public.items
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users only" ON public.composite_components
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users only" ON public.somatic_reactions
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users only" ON public.shadowtome_elixirs
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users only" ON public.journal_entries
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users only" ON public.routine_history
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users only" ON public.appointments
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users only" ON public.isotretinoin_log
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users only" ON public.codex_entries
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users only" ON public.conflict_rules
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ── Tables missing from initial draft ────────────────────────────────────────

-- storage_locations, glyph_registry, titration_log, prospective_items — unused
-- schema, no client code references them, but tightening for completeness.
DROP POLICY IF EXISTS "Allow all access" ON storage_locations;
CREATE POLICY "Require authentication" ON storage_locations FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow all access" ON glyph_registry;
CREATE POLICY "Require authentication" ON glyph_registry FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow all access" ON titration_log;
CREATE POLICY "Require authentication" ON titration_log FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow all access" ON prospective_items;
CREATE POLICY "Require authentication" ON prospective_items FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- wearable_snapshots — actively used, real health data (readiness, sleep).
-- Had two separate policies (read-only, insert-only), no update/delete
-- policy at all. Tightening both existing ones; leaving update/delete
-- un-policied as it already was (default-deny with RLS + no matching policy).
DROP POLICY IF EXISTS "Allow read access to all users" ON wearable_snapshots;
CREATE POLICY "Require authentication to read" ON wearable_snapshots FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow insert access to all users" ON wearable_snapshots;
CREATE POLICY "Require authentication to insert" ON wearable_snapshots FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
