import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdvancedInsights {
  executiveSummary: string;
  consumerPersonas: Array<{
    name: string;
    demographics: string;
    painPoints: string[];
    desires: string[];
    behaviorPatterns: string;
  }>;
  competitiveLandscape: {
    strengths: string[];
    weaknesses: string[];
    marketPosition: string;
    differentiators: string[];
  };
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
    timeframe: string;
  }>;
  trendPredictions: {
    emerging: string[];
    declining: string[];
    stable: string[];
    forecast: string;
  };
  opportunities: string[];
  threats: string[];
  sentimentTrends: {
    overall: string;
    trajectory: string;
    keyDrivers: string[];
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, userId } = await req.json();
    
    if (!keyword || !userId) {
      return new Response(
        JSON.stringify({ error: 'keyword and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating advanced insights for keyword: ${keyword}, user: ${userId}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all analysis results for this keyword
    const { data: analysisResults, error: fetchError } = await supabase
      .from('analysis_results')
      .select(`
        *,
        search_results (
          keyword,
          title,
          url,
          article_published_at,
          created_at
        )
      `)
      .eq('search_results.keyword', keyword)
      .eq('is_consumer_review', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      console.error('Failed to fetch analysis results:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch analysis results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!analysisResults || analysisResults.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No analysis results found for this keyword' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${analysisResults.length} analysis results to process`);

    // Prepare summary data for AI
    const summaryData = analysisResults.map(r => ({
      sentiment: r.sentiment,
      category: r.category,
      topics: r.key_topics,
      summary: r.summary,
      structuredData: r.structured_data,
      publishedDate: r.search_results?.article_published_at,
    }));

    // Calculate statistics
    const totalReviews = analysisResults.length;
    const sentimentCounts = analysisResults.reduce((acc: any, r) => {
      acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
      return acc;
    }, {});
    
    const sentimentScore = (
      ((sentimentCounts.positive || 0) * 1.0 +
       (sentimentCounts.neutral || 0) * 0.5 +
       (sentimentCounts.mixed || 0) * 0.3 +
       (sentimentCounts.negative || 0) * 0.0) / totalReviews
    ).toFixed(2);

    // Create AI prompt for advanced analysis
    const systemPrompt = `당신은 한국 B2B 마켓 인사이트 전문가입니다. 소비자 의견 데이터를 분석하여 기업이 실행 가능한 비즈니스 인사이트를 제공합니다.`;

    const analysisPrompt = `다음은 "${keyword}" 키워드로 수집한 ${totalReviews}개의 한국 소비자 의견 분석 결과입니다:

${JSON.stringify(summaryData, null, 2).substring(0, 8000)}

위 데이터를 종합하여 다음 형식의 고급 비즈니스 인사이트를 JSON으로 제공하세요:

{
  "executiveSummary": "300자 이내로 핵심 인사이트를 경영진에게 보고하는 톤으로 요약",
  "consumerPersonas": [
    {
      "name": "페르소나 이름 (예: 가성비 추구형 20대)",
      "demographics": "연령대, 특성 요약",
      "painPoints": ["불만사항1", "불만사항2"],
      "desires": ["원하는 것1", "원하는 것2"],
      "behaviorPatterns": "구매/사용 패턴 설명"
    }
  ],
  "competitiveLandscape": {
    "strengths": ["강점1", "강점2", "강점3"],
    "weaknesses": ["약점1", "약점2", "약점3"],
    "marketPosition": "시장 내 포지셔닝 평가",
    "differentiators": ["경쟁 우위 요소1", "경쟁 우위 요소2"]
  },
  "actionItems": [
    {
      "priority": "high/medium/low",
      "action": "구체적인 실행 방안",
      "expectedImpact": "기대 효과",
      "timeframe": "단기/중기/장기"
    }
  ],
  "trendPredictions": {
    "emerging": ["부상하는 트렌드1", "부상하는 트렌드2"],
    "declining": ["하락하는 트렌드1"],
    "stable": ["안정적인 트렌드1"],
    "forecast": "향후 3-6개월 예측"
  },
  "opportunities": ["비즈니스 기회1", "비즈니스 기회2", "비즈니스 기회3"],
  "threats": ["위협 요소1", "위협 요소2"],
  "sentimentTrends": {
    "overall": "전반적인 감성 평가",
    "trajectory": "감성 변화 추이 (상승/하락/유지)",
    "keyDrivers": ["감성에 영향을 주는 핵심 요인1", "요인2"]
  }
}

중요: 실제 데이터 기반으로 구체적이고 실행 가능한 인사이트를 제공하세요. 추상적이거나 일반적인 내용은 피하세요.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: analysisPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      return new Response(
        JSON.stringify({ error: 'AI analysis failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    // Parse JSON from AI response
    let insights: AdvancedInsights;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || aiContent.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      insights = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('AI response:', aiContent);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save to database
    const { data: savedInsight, error: insertError } = await supabase
      .from('advanced_insights')
      .insert({
        user_id: userId,
        keyword: keyword,
        executive_summary: insights.executiveSummary,
        consumer_personas: insights.consumerPersonas,
        competitive_landscape: insights.competitiveLandscape,
        action_items: insights.actionItems,
        trend_predictions: insights.trendPredictions,
        opportunities: insights.opportunities,
        threats: insights.threats,
        sentiment_trends: insights.sentimentTrends,
        total_reviews_analyzed: totalReviews,
        overall_sentiment_score: parseFloat(sentimentScore),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save insights:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save insights', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Advanced insights generated successfully');

    return new Response(
      JSON.stringify({
        message: 'Advanced insights generated successfully',
        insights: savedInsight,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-advanced-insights function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
