-- Add search period and article published date to search_results table
ALTER TABLE public.search_results 
ADD COLUMN search_period TEXT DEFAULT 'm3',
ADD COLUMN article_published_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for efficient period filtering (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_search_results_created_at ON public.search_results(created_at);
CREATE INDEX IF NOT EXISTS idx_search_results_article_published_at ON public.search_results(article_published_at);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON public.analysis_results(created_at);

-- Add comment for documentation
COMMENT ON COLUMN public.search_results.search_period IS 'Google Search API dateRestrict parameter used (d7, m1, m3, m6, y1)';
COMMENT ON COLUMN public.search_results.article_published_at IS 'Original article published date parsed from crawled content';