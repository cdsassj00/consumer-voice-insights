-- Add DELETE policy for search_results table
-- This allows users to delete their own search results
CREATE POLICY "Users can delete own search results"
ON search_results
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own search results" ON search_results IS 
'Allows authenticated users to delete search results they own. Used for manual quality control of collected articles.';