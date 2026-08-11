-- Re-apply RLS lockdown for core tables to ensure auth.uid() IS NOT NULL.

ALTER TABLE public.shadowtome_elixirs ENABLE ROW LEVEL SECURITY;

-- Drop old "allow all" policies
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

DROP POLICY IF EXISTS "Allow read access to all users" ON public.wearable_snapshots;
DROP POLICY IF EXISTS "Allow insert access to all users" ON public.wearable_snapshots;

-- Drop any existing authenticated policies just in case to be idempotent
DROP POLICY IF EXISTS "Authenticated users only" ON public.user_profile;
DROP POLICY IF EXISTS "Authenticated users only" ON public.items;
DROP POLICY IF EXISTS "Authenticated users only" ON public.composite_components;
DROP POLICY IF EXISTS "Authenticated users only" ON public.somatic_reactions;
DROP POLICY IF EXISTS "Authenticated users only" ON public.shadowtome_elixirs;
DROP POLICY IF EXISTS "Authenticated users only" ON public.journal_entries;
DROP POLICY IF EXISTS "Authenticated users only" ON public.routine_history;
DROP POLICY IF EXISTS "Authenticated users only" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users only" ON public.isotretinoin_log;
DROP POLICY IF EXISTS "Authenticated users only" ON public.codex_entries;
DROP POLICY IF EXISTS "Authenticated users only" ON public.conflict_rules;

DROP POLICY IF EXISTS "Require authentication to read" ON public.wearable_snapshots;
DROP POLICY IF EXISTS "Require authentication to insert" ON public.wearable_snapshots;

-- Create "must be authenticated" policies
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

CREATE POLICY "Require authentication to read" ON public.wearable_snapshots 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication to insert" ON public.wearable_snapshots 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
