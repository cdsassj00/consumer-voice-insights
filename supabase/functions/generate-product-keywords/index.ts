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
    const { company, product } = await req.json();
    console.log('Generating keywords for:', { company, product });

    if (!company || !product) {
      throw new Error('Company and product are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `당신은 한국 소비자 커뮤니티 게시판에서 특정 기업의 제품/서비스에 대한 소비자 의견을 수집하기 위한 검색 키워드를 생성하는 전문가입니다.

주어진 기업명과 제품/서비스명을 기반으로, 다양한 각도에서 소비자 의견을 수집할 수 있는 5~10개의 검색 키워드를 생성하세요.

키워드 생성 기준:
1. 후기/평가 관련: 후기, 평가, 리뷰, 사용기, 체험기
2. 가격/구매 관련: 가격, 할인, 프로모션, 세일, 가성비, 구매처
3. 품질/성능 관련: 품질, 성능, 효과, 장점, 단점, 비교
4. 문제/이슈 관련: 문제, 불만, 환불, A/S, 품질이슈
5. 추천/비교 관련: 추천, 대안, 비교, vs

각 키워드는 다음 형식으로 생성:
- searchQuery: "(기업명 AND 제품명 AND 키워드)" 형식
- displayName: "기업명 제품명 (키워드)" 형식

예시:
입력: company="올리브영", product="브링그린"
출력: [
  { searchQuery: "(올리브영 AND 브링그린 AND 후기)", displayName: "올리브영 브링그린 (후기)" },
  { searchQuery: "(올리브영 AND 브링그린 AND 가격)", displayName: "올리브영 브링그린 (가격)" },
  { searchQuery: "(올리브영 AND 브링그린 AND 효과)", displayName: "올리브영 브링그린 (효과)" },
  ...
]`;

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
          { role: 'user', content: `기업: ${company}\n제품/서비스: ${product}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_keywords',
              description: '기업과 제품 정보를 바탕으로 다양한 검색 키워드를 생성합니다.',
              parameters: {
                type: 'object',
                properties: {
                  keywords: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        searchQuery: {
                          type: 'string',
                          description: 'Google Search에 사용될 완전한 검색 쿼리 (AND 조건 포함)'
                        },
                        displayName: {
                          type: 'string',
                          description: '사용자에게 표시될 간단한 이름'
                        }
                      },
                      required: ['searchQuery', 'displayName']
                    },
                    minItems: 5,
                    maxItems: 10,
                    description: '생성된 키워드 배열 (5~10개)'
                  }
                },
                required: ['keywords'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_keywords' } }
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
    if (!toolCall || toolCall.function.name !== 'generate_keywords') {
      throw new Error('Failed to generate keywords from AI response');
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    const keywords = extractedData.keywords || [];

    console.log('Generated keywords:', keywords);

    return new Response(JSON.stringify({ keywords }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in generate-product-keywords function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        keywords: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
