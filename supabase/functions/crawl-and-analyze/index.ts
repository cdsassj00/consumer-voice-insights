import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  isConsumerReview: boolean;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  category: string;
  keyTopics: string[];
  summary: string;
  publishedDate?: string; // ISO 8601 format (YYYY-MM-DD)
  structuredData: {
    productMentioned?: string;
    brandMentioned?: string;
    priceDiscussed?: boolean;
    recommendationLevel?: number;
    mainIssues?: string[];
    mainPraises?: string[];
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchResultId } = await req.json();
    
    if (!searchResultId) {
      return new Response(
        JSON.stringify({ error: 'searchResultId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting crawl and analysis for search result: ${searchResultId}`);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!firecrawlApiKey || !openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get search result from database
    const { data: searchResult, error: fetchError } = await supabase
      .from('search_results')
      .select('*')
      .eq('id', searchResultId)
      .single();

    if (fetchError || !searchResult) {
      console.error('Failed to fetch search result:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Search result not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to crawling
    await supabase
      .from('search_results')
      .update({ status: 'crawling' })
      .eq('id', searchResultId);

    console.log(`Crawling URL: ${searchResult.url}`);

    // Step 1: Crawl with Firecrawl
    const crawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchResult.url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }),
    });

    if (!crawlResponse.ok) {
      const errorText = await crawlResponse.text();
      console.error('Firecrawl API error:', errorText);
      
      await supabase
        .from('search_results')
        .update({ status: 'failed' })
        .eq('id', searchResultId);

      return new Response(
        JSON.stringify({ error: 'Firecrawl API failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const crawlData = await crawlResponse.json();
    const fullContent = crawlData.data?.markdown || crawlData.data?.html || '';

    if (!fullContent) {
      console.error('No content retrieved from Firecrawl');
      
      await supabase
        .from('search_results')
        .update({ status: 'failed' })
        .eq('id', searchResultId);

      return new Response(
        JSON.stringify({ error: 'No content retrieved' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Content crawled, length: ${fullContent.length} characters`);

    // Step 2: Analyze with OpenAI (including date extraction)
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const analysisPrompt = `다음은 한국 커뮤니티 게시글의 전문입니다. 이 글을 분석해주세요.

제목: ${searchResult.title}
URL: ${searchResult.url}
전문:
${fullContent.substring(0, 4000)}

오늘 날짜: ${currentDate}

다음 항목을 분석하여 JSON 형식으로만 답변하세요:
{
  "isConsumerReview": true/false (실제 소비자의 리뷰나 의견인가?),
  "sentiment": "positive/negative/neutral/mixed" (전반적인 감성),
  "category": "제품 카테고리나 주제",
  "keyTopics": ["주요 토픽1", "주요 토픽2", ...],
  "summary": "200자 이내 요약",
  "publishedDate": "YYYY-MM-DD 형식의 게시글 작성일/발행일. 게시글에서 작성일을 찾아서 ISO 8601 형식(YYYY-MM-DD)으로 변환하세요. '3일 전', '1주일 전' 같은 상대적 시간도 오늘 날짜 기준으로 계산하세요. 찾을 수 없으면 null",
  "structuredData": {
    "productMentioned": "언급된 제품명",
    "brandMentioned": "언급된 브랜드",
    "priceDiscussed": true/false,
    "recommendationLevel": 1-5 (추천 정도),
    "mainIssues": ["문제점1", "문제점2", ...],
    "mainPraises": ["장점1", "장점2", ...]
  }
}

중요: publishedDate는 반드시 YYYY-MM-DD 형식이어야 합니다. 예: "2024-03-15", "2023-12-25" 등`;

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
            content: '당신은 한국 소비자 의견을 분석하는 전문가입니다. 항상 JSON 형식으로만 답변하세요.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      
      await supabase
        .from('search_results')
        .update({ status: 'failed' })
        .eq('id', searchResultId);

      return new Response(
        JSON.stringify({ error: 'OpenAI API failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    const analysis: AnalysisResult = JSON.parse(openaiData.choices[0].message.content);

    console.log('Analysis completed:', analysis);

    // Parse and validate the published date
    let articlePublishedAt: string | null = null;
    if (analysis.publishedDate) {
      try {
        // Validate ISO 8601 date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(analysis.publishedDate)) {
          const parsedDate = new Date(analysis.publishedDate);
          if (!isNaN(parsedDate.getTime())) {
            articlePublishedAt = parsedDate.toISOString();
            console.log(`Parsed published date: ${articlePublishedAt}`);
          } else {
            console.warn(`Invalid date value: ${analysis.publishedDate}`);
          }
        } else {
          console.warn(`Date format mismatch: ${analysis.publishedDate}`);
        }
      } catch (error) {
        console.error('Error parsing published date:', error);
      }
    }

    // Step 3: Save analysis results
    const { error: insertError } = await supabase
      .from('analysis_results')
      .insert({
        search_result_id: searchResultId,
        full_content: fullContent.substring(0, 10000), // Limit content size
        is_consumer_review: analysis.isConsumerReview,
        sentiment: analysis.sentiment,
        category: analysis.category,
        key_topics: analysis.keyTopics,
        structured_data: analysis.structuredData,
        summary: analysis.summary,
      });

    if (insertError) {
      console.error('Failed to save analysis:', insertError);
      
      await supabase
        .from('search_results')
        .update({ status: 'failed' })
        .eq('id', searchResultId);

      return new Response(
        JSON.stringify({ error: 'Failed to save analysis', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update search result status to analyzed and set published date
    const updateData: Record<string, any> = { status: 'analyzed' };
    if (articlePublishedAt) {
      updateData.article_published_at = articlePublishedAt;
    }

    await supabase
      .from('search_results')
      .update(updateData)
      .eq('id', searchResultId);

    console.log(`Analysis saved successfully. Published date: ${articlePublishedAt || 'not found'}`);

    return new Response(
      JSON.stringify({
        message: 'Crawl and analysis completed',
        searchResultId,
        analysis,
        articlePublishedAt
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in crawl-and-analyze function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
