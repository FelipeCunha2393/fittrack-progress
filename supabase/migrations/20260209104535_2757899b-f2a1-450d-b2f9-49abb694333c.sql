
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create user_roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  height_cm NUMERIC,
  initial_weight_kg NUMERIC,
  current_weight_kg NUMERIC,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Weight history
CREATE TABLE public.weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

-- Workout plans
CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  goal TEXT CHECK (goal IN ('fat_burning', 'hypertrophy', 'custom')),
  is_preset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

-- Workout sessions (A, B, C, D)
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.workout_plans(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g. 'A', 'B', 'C', 'D'
  label TEXT, -- e.g. 'Chest, Triceps, Shoulders'
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- Exercises within sessions
CREATE TABLE public.session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  suggested_reps INTEGER NOT NULL DEFAULT 10,
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;

-- Workout logs (tracking reps & weight per exercise)
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.session_exercises(id) ON DELETE CASCADE NOT NULL,
  reps_completed INTEGER NOT NULL,
  weight_used NUMERIC NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile and assign student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES

-- user_roles: users can read their own roles, admins can read all
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- profiles
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- weight_history
CREATE POLICY "Users can read own weight history" ON public.weight_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own weight" ON public.weight_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight" ON public.weight_history
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- workout_plans: users see own plans + presets, admins see all
CREATE POLICY "Users can read own or preset plans" ON public.workout_plans
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_preset = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own plans" ON public.workout_plans
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own plans" ON public.workout_plans
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own plans" ON public.workout_plans
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- workout_sessions: accessible if user owns the plan or it's preset
CREATE POLICY "Users can read sessions" ON public.workout_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_id AND (wp.user_id = auth.uid() OR wp.is_preset = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can insert sessions" ON public.workout_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_id AND (wp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can update sessions" ON public.workout_sessions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_id AND (wp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can delete sessions" ON public.workout_sessions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_id AND (wp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- session_exercises: same logic as sessions
CREATE POLICY "Users can read exercises" ON public.session_exercises
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      JOIN public.workout_plans wp ON wp.id = ws.plan_id
      WHERE ws.id = session_id AND (wp.user_id = auth.uid() OR wp.is_preset = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can insert exercises" ON public.session_exercises
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      JOIN public.workout_plans wp ON wp.id = ws.plan_id
      WHERE ws.id = session_id AND (wp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can update exercises" ON public.session_exercises
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      JOIN public.workout_plans wp ON wp.id = ws.plan_id
      WHERE ws.id = session_id AND (wp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can delete exercises" ON public.session_exercises
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      JOIN public.workout_plans wp ON wp.id = ws.plan_id
      WHERE ws.id = session_id AND (wp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- workout_logs
CREATE POLICY "Users can read own logs" ON public.workout_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own logs" ON public.workout_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON public.workout_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON public.workout_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
