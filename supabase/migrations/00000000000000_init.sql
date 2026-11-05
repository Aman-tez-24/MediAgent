-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  full_name text,
  date_of_birth date,
  sex text,
  height numeric, -- in cm
  weight numeric, -- in kg
  blood_group text,
  allergies text[],
  medical_history text,
  current_medications text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Assessments table
CREATE TABLE public.assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text,
  status text NOT NULL CHECK (status IN ('draft', 'in_progress', 'analyzing', 'completed', 'failed')),
  urgency text CHECK (urgency IN ('routine', 'soon', 'urgent', 'emergency')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at timestamp with time zone
);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own assessments" ON public.assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessments" ON public.assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assessments" ON public.assessments FOR UPDATE USING (auth.uid() = user_id);

-- Follow Up Questions table
CREATE TABLE public.follow_up_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid REFERENCES public.assessments ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  answer text,
  question_type text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.follow_up_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own follow_up_questions" ON public.follow_up_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE assessments.id = follow_up_questions.assessment_id AND assessments.user_id = auth.uid())
);
CREATE POLICY "Users can insert own follow_up_questions" ON public.follow_up_questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.assessments WHERE assessments.id = follow_up_questions.assessment_id AND assessments.user_id = auth.uid())
);
CREATE POLICY "Users can update own follow_up_questions" ON public.follow_up_questions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE assessments.id = follow_up_questions.assessment_id AND assessments.user_id = auth.uid())
);

-- Agent Runs table
CREATE TABLE public.agent_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid REFERENCES public.assessments ON DELETE CASCADE NOT NULL,
  agent_name text NOT NULL,
  status text NOT NULL,
  input jsonb,
  output jsonb,
  error text,
  execution_time integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own agent_runs" ON public.agent_runs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE assessments.id = agent_runs.assessment_id AND assessments.user_id = auth.uid())
);
-- Admin can view all
CREATE POLICY "Admin can insert agent_runs" ON public.agent_runs FOR INSERT WITH CHECK (true); -- Usually inserted via service role

-- Knowledge Sources
CREATE TABLE public.knowledge_sources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  source_url text,
  content text NOT NULL,
  category text,
  embedding vector(768), -- Gemini embeddings are typically 768 dims
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Only admins can modify knowledge sources, everyone can read
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read knowledge_sources" ON public.knowledge_sources FOR SELECT USING (true);
-- Mutations handled by service role key for admins

-- Reports table
CREATE TABLE public.reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid REFERENCES public.assessments ON DELETE CASCADE NOT NULL UNIQUE,
  summary text,
  symptoms_summary text,
  possible_explanations jsonb,
  risk_assessment jsonb,
  recommended_next_steps jsonb,
  safety_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE assessments.id = reports.assessment_id AND assessments.user_id = auth.uid())
);
CREATE POLICY "Service role can insert reports" ON public.reports FOR INSERT WITH CHECK (true);
