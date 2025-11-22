-- Add user_id to search_results and analysis_results tables
ALTER TABLE public.search_results 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster user queries
CREATE INDEX idx_search_results_user_id ON public.search_results(user_id);

-- Update RLS policies for search_results
DROP POLICY IF EXISTS "Allow all operations on search_results" ON public.search_results;

-- Users can only see their own search results
CREATE POLICY "Users can view own search results"
ON public.search_results
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own search results
CREATE POLICY "Users can insert own search results"
ON public.search_results
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own search results
CREATE POLICY "Users can update own search results"
ON public.search_results
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role can manage all search results"
ON public.search_results
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Update RLS policies for analysis_results
DROP POLICY IF EXISTS "Allow all operations on analysis_results" ON public.analysis_results;

-- Users can view analysis results for their own search results
CREATE POLICY "Users can view own analysis results"
ON public.analysis_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.search_results
    WHERE search_results.id = analysis_results.search_result_id
    AND search_results.user_id = auth.uid()
  )
);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role can manage all analysis results"
ON public.analysis_results
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);