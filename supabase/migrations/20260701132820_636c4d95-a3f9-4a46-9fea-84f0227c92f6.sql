
-- Drop old tables/columns and rebuild job_applications linked to analysis_history
DROP TABLE IF EXISTS public.saved_jobs CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_id uuid NOT NULL REFERENCES public.analysis_history(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'applied'
    CHECK (stage IN ('applied','preparing_test','preparing_interview','interview_scheduled','denied','offer')),
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, analysis_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_applications select own" ON public.job_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "job_applications insert own" ON public.job_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "job_applications update own" ON public.job_applications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "job_applications delete own" ON public.job_applications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX job_applications_user_updated_idx
  ON public.job_applications (user_id, updated_at DESC);

CREATE TRIGGER job_applications_set_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
