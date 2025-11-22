import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractDateFromSnippet(snippet: string): string | null {
  if (!snippet) return null;

  // 한국어 날짜 패턴들
  const patterns = [
    // 2024년 1월 15일, 2024년 01월 15일
    /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/,
    // 2024.01.15, 2024-01-15
    /(\d{4})[.-](\d{1,2})[.-](\d{1,2})/,
    // 24.1.15, 24-1-15
    /(\d{2})[.-](\d{1,2})[.-](\d{1,2})/,
  ];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match) {
      let year = parseInt(match[1]);
      const month = parseInt(match[2]);
      const day = parseInt(match[3]);

      // 두 자리 연도를 네 자리로 변환
      if (year < 100) {
        year = year + 2000;
      }

      // 유효한 날짜인지 확인
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return date.toISOString();
      }
    }
  }

  // 상대 시간 패턴 (1일 전, 2시간 전 등)
  const relativePatterns = [
    { pattern: /(\d+)일\s*전/, unit: 'days' },
    { pattern: /(\d+)시간\s*전/, unit: 'hours' },
    { pattern: /(\d+)분\s*전/, unit: 'minutes' },
  ];

  for (const { pattern, unit } of relativePatterns) {
    const match = snippet.match(pattern);
    if (match) {
      const value = parseInt(match[1]);
      const now = new Date();
      
      if (unit === 'days') {
        now.setDate(now.getDate() - value);
      } else if (unit === 'hours') {
        now.setHours(now.getHours() - value);
      } else if (unit === 'minutes') {
        now.setMinutes(now.getMinutes() - value);
      }
      
      return now.toISOString();
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting date extraction from snippets');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // article_published_at이 null인 모든 레코드 조회
    const { data: results, error: fetchError } = await supabase
      .from('search_results')
      .select('id, snippet')
      .is('article_published_at', null);

    if (fetchError) {
      console.error('Error fetching results:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch results', details: fetchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No results to update',
          total: 0,
          updated: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${results.length} results to process`);

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    // 각 레코드 처리
    for (const result of results) {
      try {
        const extractedDate = extractDateFromSnippet(result.snippet || '');
        
        if (extractedDate) {
          const { error: updateError } = await supabase
            .from('search_results')
            .update({ article_published_at: extractedDate })
            .eq('id', result.id);

          if (updateError) {
            failed++;
            errors.push(`${result.id}: ${updateError.message}`);
            console.error(`Failed to update ${result.id}:`, updateError);
          } else {
            updated++;
            console.log(`Updated ${result.id} with date: ${extractedDate}`);
          }
        } else {
          console.log(`No date found in snippet for ${result.id}`);
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${result.id}: ${errorMessage}`);
        console.error(`Error processing ${result.id}:`, error);
      }
    }

    console.log(`Extraction completed: ${updated} updated, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: 'Date extraction completed',
        total: results.length,
        updated,
        failed,
        errors: errors.slice(0, 10) // 처음 10개 에러만 반환
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-dates-from-snippets function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
