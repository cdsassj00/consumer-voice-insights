import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log('Extracting keywords from query:', query);

    if (!query || typeof query !== 'string') {
      throw new Error('Query is required and must be a string');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `당신은 한국어 검색 쿼리를 분석하여 최적의 Google 검색 쿼리를 생성하는 전문가입니다.

사용자의 자연어 질문을 분석하여:
1. 핵심 키워드를 추출 (브랜드명, 제품명, 주제어 등)
2. 키워드 간 관계를 파악하여 적절한 AND/OR 조건을 결정
3. Google 검색에 최적화된 쿼리 문자열을 생성

판단 기준:
- 여러 브랜드/제품 중 하나를 찾는 경우 → OR 조건 (예: "삼성 OR LG")
- 특정 브랜드/제품의 특정 속성을 찾는 경우 → AND 조건 (예: "올리브영 AND 신제품 AND 후기")
- 복합적인 경우 → AND와 OR 혼용 (예: "올리브영 AND (신제품 OR 베스트셀러) AND 후기")

예시:
- 입력: "올리브영 신제품 후기가 궁금해" → searchQuery: "올리브영 AND 신제품 AND 후기", keywords: ["올리브영", "신제품", "후기"]
- 입력: "브링그린이나 아누아 제품 평가" → searchQuery: "(브링그린 OR 아누아) AND 제품 AND 평가", keywords: ["브링그린", "아누아", "제품", "평가"]
- 입력: "다이소 가성비 제품" → searchQuery: "다이소 AND 가성비 AND 제품", keywords: ["다이소", "가성비", "제품"]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_search_query',
              description: '자연어 입력을 분석하여 Google 검색에 최적화된 쿼리를 생성합니다.',
              parameters: {
                type: 'object',
                properties: {
                  searchQuery: {
                    type: 'string',
                    description: 'AND/OR 조건이 포함된 완성된 검색 쿼리 문자열 (예: "올리브영 AND 신제품 AND 후기")'
                  },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '추출된 핵심 키워드 배열',
                    minItems: 1,
                    maxItems: 5
                  }
                },
                required: ['searchQuery', 'keywords'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_search_query' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Lovable AI response:', JSON.stringify(data));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_search_query') {
      throw new Error('Failed to generate search query from AI response');
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    const searchQuery = extractedData.searchQuery || '';
    const keywords = extractedData.keywords || [];

    console.log('Generated search query:', searchQuery);
    console.log('Extracted keywords:', keywords);

    const result = {
      searchQuery,
      keywords,
      originalQuery: query
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in extract-keywords function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        searchQuery: '',
        keywords: [],
        originalQuery: ''
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
