-- The client has been sending a "symptoms" array on every somatic_reactions
-- insert/update since this feature was built, but no such column has ever
-- existed on this table — every write has been failing with
-- PGRST204 "Could not find the 'symptoms' column". This adds it, matching
-- what the code already sends (Array.from(reactionForm.reactions)).
ALTER TABLE public.somatic_reactions
ADD COLUMN IF NOT EXISTS symptoms TEXT[] DEFAULT '{}';
