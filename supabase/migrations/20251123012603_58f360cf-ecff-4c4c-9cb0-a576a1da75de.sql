-- Create table for advanced business insights
CREATE TABLE IF NOT EXISTS public.advanced_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  search_period TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Executive Summary
  executive_summary TEXT NOT NULL,
  
  -- Consumer Personas (JSON array of personas)
  consumer_personas JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Competitive Analysis
  competitive_landscape JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Business Action Items (prioritized list)
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Trend Predictions
  trend_predictions JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Opportunities & Threats
  opportunities JSONB NOT NULL DEFAULT '[]'::jsonb,
  threats JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Sentiment Evolution (over time)
  sentiment_trends JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Key Statistics
  total_reviews_analyzed INTEGER NOT NULL DEFAULT 0,
  overall_sentiment_score NUMERIC(3,2),
  engagement_rate NUMERIC(5,2)
);

-- Enable RLS
ALTER TABLE public.advanced_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own advanced insights"
  ON public.advanced_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own advanced insights"
  ON public.advanced_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own advanced insights"
  ON public.advanced_insights
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own advanced insights"
  ON public.advanced_insights
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_advanced_insights_user_keyword 
  ON public.advanced_insights(user_id, keyword, created_at DESC);