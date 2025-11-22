import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleSearchResult {
  link: string;
  title: string;
  snippet: string;
  displayLink: string;
}

interface FilterDecision {
  isValid: boolean;
  reason: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword } = await req.json();
    
    if (!keyword) {
      return new Response(
        JSON.stringify({ error: 'keyword is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting search for keyword: ${keyword}`);

    // Get API keys from environment
    const googleApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
    const searchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!googleApiKey || !searchEngineId || !openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Call Google Search Engine API
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(keyword)}&num=10&gl=kr&hl=ko`;
    
    console.log('Calling Google Search API...');
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Google Search API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Google Search API failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    const items: GoogleSearchResult[] = searchData.items || [];
    
    console.log(`Found ${items.length} search results`);

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No search results found', validResults: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Filter results using OpenAI
    const validResults = [];
    
    for (const item of items) {
      console.log(`Filtering: ${item.title}`);
      
      const filterPrompt = `다음 검색 결과가 실제 한국 소비자의 리뷰나 의견인지 판단해주세요.

제목: ${item.title}
설명: ${item.snippet}
도메인: ${item.displayLink}

제외해야 할 것:
- 광고 (ad, 협찬, sponsored)
- 프로모션 (할인, 이벤트 안내)
- 가십/연예 뉴스
- 언론 기사 (뉴스 사이트)
- 공식 홍보 글

포함해야 할 것:
- 실제 소비자의 사용 후기
- 제품/서비스에 대한 개인 의견
- 커뮤니티 게시판의 질문/토론

JSON 형식으로만 답변하세요:
{"isValid": true/false, "reason": "이유를 한 줄로"}`;

      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: '당신은 한국 소비자 의견을 필터링하는 전문가입니다. 항상 JSON 형식으로 답변하세요.'
              },
              {
                role: 'user',
                content: filterPrompt
              }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
          }),
        });

        if (!openaiResponse.ok) {
          console.error('OpenAI API error for item:', item.title);
          continue;
        }

        const openaiData = await openaiResponse.json();
        const decision: FilterDecision = JSON.parse(openaiData.choices[0].message.content);
        
        console.log(`Result for "${item.title}": ${decision.isValid ? 'VALID' : 'INVALID'} - ${decision.reason}`);

        if (decision.isValid) {
          validResults.push({
            url: item.link,
            title: item.title,
            snippet: item.snippet,
            source_domain: item.displayLink,
            reason: decision.reason
          });
        }
      } catch (error) {
        console.error('Error filtering item:', error);
        continue;
      }
    }

    console.log(`Filtered results: ${validResults.length} valid out of ${items.length}`);

    // Step 3: Save valid results to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const insertPromises = validResults.map(result => 
      supabase.from('search_results').insert({
        keyword,
        url: result.url,
        title: result.title,
        snippet: result.snippet,
        source_domain: result.source_domain,
        status: 'pending'
      })
    );

    const insertResults = await Promise.allSettled(insertPromises);
    
    const successCount = insertResults.filter(r => r.status === 'fulfilled').length;
    const failCount = insertResults.filter(r => r.status === 'rejected').length;
    
    console.log(`Saved to database: ${successCount} succeeded, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: 'Search and filtering completed',
        totalFound: items.length,
        validResults: validResults.length,
        savedToDatabase: successCount,
        results: validResults
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-and-filter function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
