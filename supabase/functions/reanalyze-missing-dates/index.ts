import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting reanalysis of data with missing article_published_at');

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all search results that have null article_published_at
    const { data: resultsToReanalyze, error: fetchError } = await supabase
      .from('search_results')
      .select('id, title, status')
      .eq('user_id', user.id)
      .is('article_published_at', null)
      .in('status', ['pending', 'analyzed']) // 재분석 대상: pending 또는 이미 analyzed지만 날짜 없는 것
      .order('created_at', { ascending: false })
      .limit(50); // 한 번에 최대 50개씩 처리

    if (fetchError) {
      console.error('Error fetching results:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch results', details: fetchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!resultsToReanalyze || resultsToReanalyze.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No results to reanalyze',
          total: 0,
          processed: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${resultsToReanalyze.length} results to reanalyze`);

    // Process each result in the background
    const results = {
      total: resultsToReanalyze.length,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process results with delay to avoid rate limits
    for (const result of resultsToReanalyze) {
      try {
        console.log(`Reanalyzing: ${result.title} (${result.id})`);
        
        // Call crawl-and-analyze for each result
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/crawl-and-analyze`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({ searchResultId: result.id }),
          }
        );

        if (response.ok) {
          results.succeeded++;
          console.log(`Successfully reanalyzed: ${result.title}`);
        } else {
          results.failed++;
          const errorText = await response.text();
          results.errors.push(`${result.title}: ${errorText}`);
          console.error(`Failed to reanalyze ${result.title}:`, errorText);
        }

        // Add delay between requests to avoid rate limits (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${result.title}: ${errorMessage}`);
        console.error(`Error reanalyzing ${result.title}:`, error);
      }
    }

    console.log(`Reanalysis completed: ${results.succeeded} succeeded, ${results.failed} failed`);

    return new Response(
      JSON.stringify({
        message: 'Reanalysis batch completed',
        ...results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reanalyze-missing-dates function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
