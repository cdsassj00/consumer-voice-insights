-- Create keywords table for user-managed keywords
CREATE TABLE public.keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('brand', 'product', 'service', 'other')),
  keyword TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, keyword)
);

-- Enable RLS
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

-- Users can view their own keywords
CREATE POLICY "Users can view own keywords"
ON public.keywords
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own keywords
CREATE POLICY "Users can insert own keywords"
ON public.keywords
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own keywords
CREATE POLICY "Users can update own keywords"
ON public.keywords
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own keywords
CREATE POLICY "Users can delete own keywords"
ON public.keywords
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_keywords_user_id ON public.keywords(user_id);
CREATE INDEX idx_keywords_category ON public.keywords(category);
CREATE INDEX idx_keywords_is_active ON public.keywords(is_active);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_keywords_updated_at
BEFORE UPDATE ON public.keywords
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();