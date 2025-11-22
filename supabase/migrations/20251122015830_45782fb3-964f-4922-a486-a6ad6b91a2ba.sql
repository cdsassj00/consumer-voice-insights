-- Create enum for search result status
CREATE TYPE search_status AS ENUM ('pending', 'crawling', 'analyzed', 'failed');

-- Create enum for sentiment analysis
CREATE TYPE sentiment_type AS ENUM ('positive', 'negative', 'neutral', 'mixed');

-- First stage: Filtered search results from Google Search Engine
CREATE TABLE public.search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  snippet TEXT,
  source_domain TEXT,
  status search_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster keyword searches
CREATE INDEX idx_search_results_keyword ON public.search_results(keyword);
CREATE INDEX idx_search_results_status ON public.search_results(status);
CREATE INDEX idx_search_results_created_at ON public.search_results(created_at DESC);

-- Second stage: Detailed analysis results from Firecrawl + LLM
CREATE TABLE public.analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_result_id UUID REFERENCES public.search_results(id) ON DELETE CASCADE NOT NULL,
  full_content TEXT,
  is_consumer_review BOOLEAN NOT NULL,
  sentiment sentiment_type,
  category TEXT,
  key_topics JSONB,
  structured_data JSONB,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_analysis_results_search_result_id ON public.analysis_results(search_result_id);
CREATE INDEX idx_analysis_results_sentiment ON public.analysis_results(sentiment);
CREATE INDEX idx_analysis_results_is_consumer_review ON public.analysis_results(is_consumer_review);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates on search_results
CREATE TRIGGER update_search_results_updated_at
BEFORE UPDATE ON public.search_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();