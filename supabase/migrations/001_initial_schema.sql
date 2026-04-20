-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing triggers and functions first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- Drop tables with CASCADE (removes policies, indexes, triggers automatically)
DROP TABLE IF EXISTS public.form_views CASCADE;
DROP TABLE IF EXISTS public.responses CASCADE;
DROP TABLE IF EXISTS public.fields CASCADE;
DROP TABLE IF EXISTS public.forms CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop type
DROP TYPE IF EXISTS public.field_type;

-- Recreate type
CREATE TYPE public.field_type AS ENUM (
  'text', 'email', 'phone', 'select', 'checkbox', 'radio',
  'date', 'file', 'textarea', 'number'
);

-- Profiles table (extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Forms table
CREATE TABLE public.forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  slug TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  publicado BOOLEAN DEFAULT false,
  configuracoes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fields table
CREATE TABLE public.fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('text', 'email', 'phone', 'select', 'checkbox', 'radio', 'date', 'file', 'textarea', 'number')),
  label TEXT NOT NULL,
  placeholder TEXT,
  obrigatorio BOOLEAN DEFAULT false,
  opcoes JSONB,
  ordem INTEGER NOT NULL,
  logica JSONB,
  canvas_meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Responses table
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  respostas JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Form views tracking
CREATE TABLE public.form_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_forms_user_id ON public.forms(user_id);
CREATE INDEX idx_forms_slug ON public.forms(slug);
CREATE INDEX idx_fields_form_id ON public.fields(form_id);
CREATE INDEX idx_responses_form_id ON public.responses(form_id);
CREATE INDEX idx_responses_created_at ON public.responses(created_at);
CREATE INDEX idx_form_views_form_id ON public.form_views(form_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_views ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Forms policies
CREATE POLICY "Users can view own forms" ON public.forms
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view published forms" ON public.forms
  FOR SELECT USING (publicado = true);
CREATE POLICY "Users can create forms" ON public.forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own forms" ON public.forms
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own forms" ON public.forms
  FOR DELETE USING (auth.uid() = user_id);

-- Fields policies
CREATE POLICY "Users can view own fields" ON public.fields
  FOR SELECT USING (
    form_id IN (SELECT id FROM public.forms WHERE user_id = auth.uid())
  );
CREATE POLICY "Public can view published form fields" ON public.fields
  FOR SELECT USING (
    form_id IN (SELECT id FROM public.forms WHERE publicado = true)
  );
CREATE POLICY "Users can create fields" ON public.fields
  FOR INSERT WITH CHECK (
    form_id IN (SELECT id FROM public.forms WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update own fields" ON public.fields
  FOR UPDATE USING (
    form_id IN (SELECT id FROM public.forms WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete own fields" ON public.fields
  FOR DELETE USING (
    form_id IN (SELECT id FROM public.forms WHERE user_id = auth.uid())
  );

-- Responses policies
CREATE POLICY "Users can view own responses" ON public.responses
  FOR SELECT USING (
    form_id IN (SELECT id FROM public.forms WHERE user_id = auth.uid())
  );
CREATE POLICY "Anyone can submit responses" ON public.responses
  FOR INSERT WITH CHECK (
    form_id IN (SELECT id FROM public.forms WHERE publicado = true)
  );

-- Form views policies
CREATE POLICY "Users can view own form views" ON public.form_views
  FOR SELECT USING (
    form_id IN (SELECT id FROM public.forms WHERE user_id = auth.uid())
  );
CREATE POLICY "Anyone can create form views" ON public.form_views
  FOR INSERT WITH CHECK (
    form_id IN (SELECT id FROM public.forms)
  );
