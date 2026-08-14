-- Fix permissions and RLS policies for profiles used by the authenticated app.

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.is_kepala_sekolah()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'kepala_sekolah'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_kepala_sekolah() TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Kepala sekolah can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Kepala sekolah can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Kepala sekolah can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_kepala_sekolah());

CREATE POLICY "Kepala sekolah can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_kepala_sekolah())
WITH CHECK (public.is_kepala_sekolah());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
