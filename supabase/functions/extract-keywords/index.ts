import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KeywordExtractionResult {
  keywords: string[];
  originalQuery: string;
}

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

    const systemPrompt = `당신은 한국어 검색 쿼리에서 핵심 키워드를 추출하는 전문가입니다.

사용자의 자연어 질문이나 검색 의도를 분석하여, 실제 검색에 사용할 핵심 키워드를 추출하세요.

규칙:
1. 브랜드명, 제품명, 서비스명 등 고유명사를 우선 추출
2. 핵심 주제어를 추출 (예: "신제품", "후기", "가격" 등)
3. 불필요한 조사, 문법 요소는 제거
4. 1-3개의 핵심 키워드만 추출
5. 검색 효율성을 위해 가장 중요한 키워드만 선택

예시:
- 입력: "올리브영의 신제품에 대한 소비자 반응이 궁금해" → 출력: ["올리브영", "신제품"]
- 입력: "브링그린 제품 후기 알고싶어" → 출력: ["브링그린", "후기"]
- 입력: "다이소 가성비 좋은 제품" → 출력: ["다이소", "가성비"]`;

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
              name: 'extract_keywords',
              description: '검색 쿼리에서 핵심 키워드를 추출합니다.',
              parameters: {
                type: 'object',
                properties: {
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '추출된 핵심 키워드 배열 (1-3개)',
                    minItems: 1,
                    maxItems: 3
                  }
                },
                required: ['keywords'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_keywords' } }
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
    if (!toolCall || toolCall.function.name !== 'extract_keywords') {
      throw new Error('Failed to extract keywords from AI response');
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    const keywords = extractedData.keywords || [];

    console.log('Extracted keywords:', keywords);

    const result: KeywordExtractionResult = {
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
