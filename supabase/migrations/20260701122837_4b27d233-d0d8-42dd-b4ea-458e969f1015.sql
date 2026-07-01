ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
UPDATE public.profiles SET country = target_region WHERE country IS NULL AND target_region IS NOT NULL;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS target_region;