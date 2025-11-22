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
    const { results } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 제목과 스니펫만 추출하여 LLM에 전달
    const combinedText = results
      .map((r: any, idx: number) => `[${idx + 1}] 제목: ${r.title}\n내용: ${r.snippet}`)
      .join('\n\n');

    const systemPrompt = `당신은 한국 소비자 리뷰 분석 전문가입니다. 주어진 게시글들의 제목과 스니펫을 분석하여 다음 정보를 JSON 형식으로 반환하세요:

{
  "sentiment": {
    "positive": 긍정 비율(0-100),
    "neutral": 중립 비율(0-100),
    "negative": 부정 비율(0-100)
  },
  "topKeywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "mainTopics": [
    {"topic": "주제1", "count": 언급횟수},
    {"topic": "주제2", "count": 언급횟수},
    {"topic": "주제3", "count": 언급횟수}
  ],
  "categoryAnalysis": {
    "product": {"mentions": 수치, "sentiment": "긍정|중립|부정", "keywords": ["키워드1", "키워드2"]},
    "service": {"mentions": 수치, "sentiment": "긍정|중립|부정", "keywords": ["키워드1", "키워드2"]},
    "store": {"mentions": 수치, "sentiment": "긍정|중립|부정", "keywords": ["키워드1", "키워드2"]},
    "price": {"mentions": 수치, "sentiment": "긍정|중립|부정", "keywords": ["키워드1", "키워드2"]},
    "quality": {"mentions": 수치, "sentiment": "긍정|중립|부정", "keywords": ["키워드1", "키워드2"]}
  },
  "keyOpinions": [
    {"opinion": "주요 의견 1", "sentiment": "긍정|부정", "frequency": 언급횟수},
    {"opinion": "주요 의견 2", "sentiment": "긍정|부정", "frequency": 언급횟수},
    {"opinion": "주요 의견 3", "sentiment": "긍정|부정", "frequency": 언급횟수}
  ],
  "networkGraph": {
    "nodes": [
      {"id": "키워드1", "value": 중요도(1-10), "category": "카테고리"},
      {"id": "키워드2", "value": 중요도(1-10), "category": "카테고리"}
    ],
    "links": [
      {"source": "키워드1", "target": "키워드2", "value": 연관강도(1-5)}
    ]
  },
  "quantitativeMetrics": {
    "totalMentions": 전체언급수,
    "avgSentimentScore": 평균감성점수(-1.0~1.0),
    "engagementRate": 참여율(0-100),
    "trendDirection": "상승|하락|안정",
    "growthRate": 증가율(%)
  },
  "summary": "전체적인 소비자 의견 요약 (2-3문장)"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `다음 게시글들을 분석해주세요:\n\n${combinedText}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "크레딧이 부족합니다. Lovable AI 워크스페이스에 크레딧을 추가해주세요." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI 분석 중 오류가 발생했습니다." }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const analysisResult = JSON.parse(data.choices[0].message.content);

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-first-stage function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
