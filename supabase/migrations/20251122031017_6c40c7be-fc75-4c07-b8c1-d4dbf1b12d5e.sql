-- Add smart keyword library columns to keywords table
ALTER TABLE public.keywords 
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS search_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_searched_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- Make category nullable for flexible keyword management
ALTER TABLE public.keywords 
ALTER COLUMN category DROP NOT NULL;

-- Create index for faster queries on favorite keywords
CREATE INDEX IF NOT EXISTS idx_keywords_is_favorite ON public.keywords(user_id, is_favorite) WHERE is_favorite = true;

-- Create index for faster queries on search history
CREATE INDEX IF NOT EXISTS idx_keywords_last_searched ON public.keywords(user_id, last_searched_at DESC);

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_keywords_source ON public.keywords(user_id, source);