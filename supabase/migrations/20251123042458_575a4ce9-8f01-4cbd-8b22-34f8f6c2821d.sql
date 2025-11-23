-- Add display_name column to keywords table for human-readable display
ALTER TABLE public.keywords 
ADD COLUMN display_name text;