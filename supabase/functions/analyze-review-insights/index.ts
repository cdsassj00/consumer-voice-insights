import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { reviews } = await req.json();
    
    if (!reviews || reviews.length === 0) {
      throw new Error("리뷰 데이터가 없습니다.");
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `다음 리뷰 데이터를 분석하여 JSON 형식으로 결과를 반환해주세요:

리뷰 데이터:
${reviews.slice(0, 50).join('\n\n')}

다음 형식으로 분석 결과를 제공해주세요:
{
  "sentiment": [
    {"label": "긍정", "count": 숫자},
    {"label": "부정", "count": 숫자},
    {"label": "중립", "count": 숫자}
  ],
  "topics": [
    {"topic": "주제명", "count": 언급횟수}
  ],
  "personas": [
    "페르소나 설명 1",
    "페르소나 설명 2",
    "페르소나 설명 3"
  ],
  "networkGraph": {
    "nodes": [
      {"id": "키워드1", "label": "키워드1"},
      {"id": "키워드2", "label": "키워드2"}
    ],
    "edges": [
      {"source": "키워드1", "target": "키워드2"}
    ]
  }
}

- sentiment: 리뷰의 감성을 긍정/부정/중립로 분류하고 각 개수를 계산
- topics: 주요 토픽을 추출하고 언급 빈도를 계산 (최대 10개)
- personas: 소비자 페르소나 3가지 도출
- networkGraph: 주요 키워드 간 연관관계를 노드와 엣지로 표현 (최대 10개 노드)

JSON만 반환하고 다른 설명은 하지 마세요.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: '당신은 소비자 리뷰 분석 전문가입니다. 항상 유효한 JSON 형식으로만 응답하세요.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI 분석 요청 실패');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // JSON 추출 (마크다운 코드블록 제거)
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].trim();
    }
    
    const analysisResult = JSON.parse(jsonContent);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-review-insights:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      sentiment: [
        { label: "긍정", count: 0 },
        { label: "부정", count: 0 },
        { label: "중립", count: 0 }
      ],
      topics: [],
      personas: [],
      networkGraph: { nodes: [], edges: [] }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
