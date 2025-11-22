-- Fix security issues

-- 1. Fix function search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Enable RLS on search_results table
ALTER TABLE public.search_results ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on analysis_results table
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive policies for now (will be restricted when authentication is added)
-- Allow all operations for now since this will be managed through Edge Functions
CREATE POLICY "Allow all operations on search_results"
ON public.search_results
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on analysis_results"
ON public.analysis_results
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);