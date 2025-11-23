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
    const { searchResults } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 제목과 스니펫만 추출하여 LLM에 전달
    const combinedText = searchResults
      .map((r: any, idx: number) => `[${idx + 1}] 제목: ${r.title}\n내용: ${r.snippet}`)
      .join('\n\n');

    const systemPrompt = `You are a Korean consumer review analysis expert with deep business intelligence capabilities. Analyze the given post titles and snippets to extract actionable business insights beyond basic statistics. Return ONLY a valid JSON object (no markdown, no explanations, just pure JSON) with this exact structure:

{
  "sentiment": {
    "positive": <number 0-100>,
    "neutral": <number 0-100>,
    "negative": <number 0-100>
  },
  "topKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "mainTopics": [
    {"topic": "topic1", "count": <number>},
    {"topic": "topic2", "count": <number>},
    {"topic": "topic3", "count": <number>}
  ],
  "categoryAnalysis": {
    "product": {"mentions": <number>, "sentiment": "긍정|중립|부정", "keywords": ["kw1", "kw2"]},
    "service": {"mentions": <number>, "sentiment": "긍정|중립|부정", "keywords": ["kw1", "kw2"]},
    "store": {"mentions": <number>, "sentiment": "긍정|중립|부정", "keywords": ["kw1", "kw2"]},
    "price": {"mentions": <number>, "sentiment": "긍정|중립|부정", "keywords": ["kw1", "kw2"]},
    "quality": {"mentions": <number>, "sentiment": "긍정|중립|부정", "keywords": ["kw1", "kw2"]}
  },
  "keyOpinions": [
    {"opinion": "주요 의견", "sentiment": "긍정|부정", "frequency": <number>}
  ],
  "consumerPersonas": [
    {
      "persona": "페르소나명 (예: 가성비 추구형 20대)",
      "characteristics": "주요 특징 및 행동 패턴",
      "painPoints": ["불만점1", "불만점2"],
      "desires": ["욕구1", "욕구2"]
    }
  ],
  "competitiveInsights": {
    "competitorMentions": [
      {"brand": "경쟁 브랜드명", "context": "언급 맥락", "sentiment": "긍정|부정|중립"}
    ],
    "comparativeAdvantages": ["우리의 강점1", "우리의 강점2"],
    "competitiveThreats": ["경쟁사 강점1", "경쟁사 강점2"]
  },
  "purchaseDrivers": {
    "motivations": ["구매 동기1", "구매 동기2"],
    "barriers": ["구매 장벽1", "구매 장벽2"],
    "decisionFactors": [
      {"factor": "결정 요인", "importance": "높음|중간|낮음"}
    ]
  },
  "actionableRecommendations": [
    {
      "priority": "높음|중간|낮음",
      "category": "제품개선|마케팅|고객서비스|가격전략",
      "recommendation": "구체적인 실행 제안",
      "expectedImpact": "예상되는 비즈니스 효과"
    }
  ],
  "emergingTrends": [
    {
      "trend": "트렌드명",
      "description": "트렌드 설명",
      "businessImplication": "비즈니스 시사점"
    }
  ],
  "networkGraph": {
    "nodes": [
      {"id": "keyword", "value": <number 1-10>, "category": "category"}
    ],
    "links": [
      {"source": "keyword1", "target": "keyword2", "value": <number 1-5>}
    ]
  },
  "quantitativeMetrics": {
    "totalMentions": <number>,
    "avgSentimentScore": <number -1.0 to 1.0>,
    "engagementRate": <number 0-100>,
    "trendDirection": "상승|하락|안정",
    "growthRate": <number>
  },
  "summary": "전체 요약 문장 (비즈니스 인사이트 중심)"
}

ANALYSIS GUIDELINES:
- Extract consumer personas from writing style, concerns, and behavior patterns
- Identify competitive brand mentions and positioning insights
- Focus on actionable business recommendations, not just statistics
- Highlight emerging trends that could impact business strategy
- Prioritize insights that drive real business decisions

IMPORTANT: Return ONLY valid JSON. No markdown code blocks, no additional text.`;

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
    let content = data.choices[0].message.content;
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log("LLM Response content:", content);
    
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Failed to parse content:", content);
      throw new Error(`Invalid JSON from LLM: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }

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
