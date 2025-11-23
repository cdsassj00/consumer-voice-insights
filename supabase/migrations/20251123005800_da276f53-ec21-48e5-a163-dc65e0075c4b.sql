-- Create first stage analysis cache table
CREATE TABLE public.first_stage_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  keyword TEXT,
  search_period TEXT,
  result_count INTEGER NOT NULL,
  analysis_data JSONB NOT NULL,
  trend_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, cache_key)
);

-- Enable RLS
ALTER TABLE public.first_stage_analysis_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own cache"
ON public.first_stage_analysis_cache
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cache"
ON public.first_stage_analysis_cache
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cache"
ON public.first_stage_analysis_cache
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster cache lookups
CREATE INDEX idx_cache_lookup ON public.first_stage_analysis_cache(user_id, cache_key);