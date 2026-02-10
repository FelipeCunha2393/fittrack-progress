
CREATE TABLE public.cardio_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  distance_km NUMERIC,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cardio_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own cardio" ON public.cardio_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own cardio" ON public.cardio_logs FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own cardio" ON public.cardio_logs FOR DELETE USING (auth.uid() = user_id);
