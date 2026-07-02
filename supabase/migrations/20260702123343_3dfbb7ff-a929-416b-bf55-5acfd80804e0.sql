CREATE TABLE public.stage_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (application_id, stage)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stage_recommendations TO authenticated;
GRANT ALL ON public.stage_recommendations TO service_role;

ALTER TABLE public.stage_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own recommendations"
  ON public.stage_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own recommendations"
  ON public.stage_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own recommendations"
  ON public.stage_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own recommendations"
  ON public.stage_recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER stage_recommendations_set_updated_at
  BEFORE UPDATE ON public.stage_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_stage_recommendations_app ON public.stage_recommendations(application_id);