import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MessageSquare, Hash, Calendar, Network, ShoppingBag, Star, TrendingDown, Activity } from "lucide-react";

interface FirstStageAnalysisProps {
  analysis: {
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
    topKeywords: string[];
    mainTopics: Array<{ topic: string; count: number }>;
    categoryAnalysis?: {
      product?: { mentions: number; sentiment: string; keywords: string[] };
      service?: { mentions: number; sentiment: string; keywords: string[] };
      store?: { mentions: number; sentiment: string; keywords: string[] };
      price?: { mentions: number; sentiment: string; keywords: string[] };
      quality?: { mentions: number; sentiment: string; keywords: string[] };
    };
    keyOpinions?: Array<{ opinion: string; sentiment: string; frequency: number }>;
    networkGraph?: {
      nodes: Array<{ id: string; value: number; category: string }>;
      links: Array<{ source: string; target: string; value: number }>;
    };
    quantitativeMetrics?: {
      totalMentions: number;
      avgSentimentScore: number;
      engagementRate: number;
      trendDirection: string;
      growthRate: number;
    };
    summary: string;
  };
  trendData: Array<{ date: string; count: number }>;
}

export function FirstStageAnalysis({ analysis, trendData }: FirstStageAnalysisProps) {
  const sentimentData = [
    { name: "긍정", value: analysis.sentiment.positive, color: "#10b981" },
    { name: "중립", value: analysis.sentiment.neutral, color: "#6b7280" },
    { name: "부정", value: analysis.sentiment.negative, color: "#ef4444" },
  ];

  // 카테고리별 데이터 변환
  const categoryData = analysis.categoryAnalysis ? [
    { category: "제품", value: analysis.categoryAnalysis.product?.mentions || 0, sentiment: analysis.categoryAnalysis.product?.sentiment },
    { category: "서비스", value: analysis.categoryAnalysis.service?.mentions || 0, sentiment: analysis.categoryAnalysis.service?.sentiment },
    { category: "매장", value: analysis.categoryAnalysis.store?.mentions || 0, sentiment: analysis.categoryAnalysis.store?.sentiment },
    { category: "가격", value: analysis.categoryAnalysis.price?.mentions || 0, sentiment: analysis.categoryAnalysis.price?.sentiment },
    { category: "품질", value: analysis.categoryAnalysis.quality?.mentions || 0, sentiment: analysis.categoryAnalysis.quality?.sentiment },
  ] : [];

  // 네트워크 그래프 데이터 (노드 크기 조정)
  const networkData = analysis.networkGraph?.nodes.map(node => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: node.value * 10,
    name: node.id,
    category: node.category
  })) || [];

  const getSentimentColor = (sentiment: string) => {
    switch(sentiment) {
      case '긍정': return '#10b981';
      case '부정': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          AI 1차 데이터베이스 심층 분석
        </h3>
        <p className="text-sm text-muted-foreground">
          수집된 게시글을 AI가 다각도로 분석한 결과입니다. 네트워크 그래프, 카테고리별 분석, 주요 소비자 의견 등을 확인하세요.
        </p>
      </div>

      {/* 정량적 지표 카드 */}
      {analysis.quantitativeMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Activity className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{analysis.quantitativeMetrics.totalMentions}</div>
                <div className="text-xs text-muted-foreground">총 언급 수</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Star className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{analysis.quantitativeMetrics.avgSentimentScore.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">평균 감성 점수</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{analysis.quantitativeMetrics.engagementRate}%</div>
                <div className="text-xs text-muted-foreground">참여율</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                {analysis.quantitativeMetrics.trendDirection === '상승' ? (
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-success" />
                ) : (
                  <TrendingDown className="w-6 h-6 mx-auto mb-2 text-destructive" />
                )}
                <div className="text-2xl font-bold">{analysis.quantitativeMetrics.trendDirection}</div>
                <div className="text-xs text-muted-foreground">트렌드 방향</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{analysis.quantitativeMetrics.growthRate > 0 ? '+' : ''}{analysis.quantitativeMetrics.growthRate}%</div>
                <div className="text-xs text-muted-foreground">증가율</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 감성 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">감성 분석</CardTitle>
            <CardDescription>전체 게시글의 감성 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 주요 토픽 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">주요 토픽</CardTitle>
            <CardDescription>가장 많이 언급된 주제</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analysis.mainTopics}>
                <XAxis dataKey="topic" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 카테고리별 분석 */}
      {analysis.categoryAnalysis && categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              카테고리별 키워드 분석
            </CardTitle>
            <CardDescription>제품, 서비스, 매장 등 다양한 관점의 소비자 의견</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={categoryData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="category" stroke="hsl(var(--foreground))" />
                  <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
                  <Radar name="언급 빈도" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analysis.categoryAnalysis).map(([key, data]) => data && (
                  <div key={key} className="p-4 border rounded-lg space-y-2" style={{ borderColor: getSentimentColor(data.sentiment) }}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize">
                        {key === 'product' ? '제품' : key === 'service' ? '서비스' : key === 'store' ? '매장' : key === 'price' ? '가격' : '품질'}
                      </span>
                      <Badge style={{ backgroundColor: getSentimentColor(data.sentiment), color: 'white' }}>
                        {data.sentiment}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{data.mentions}건</div>
                    <div className="flex flex-wrap gap-1">
                      {data.keywords.slice(0, 3).map((kw, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 네트워크 그래프 */}
      {analysis.networkGraph && networkData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Network className="w-5 h-5" />
              키워드 네트워크 그래프
            </CardTitle>
            <CardDescription>키워드 간 연관관계 분석</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                <ZAxis type="number" dataKey="z" range={[100, 1000]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{payload[0].payload.name}</p>
                          <p className="text-sm text-muted-foreground">{payload[0].payload.category}</p>
                          <p className="text-xs mt-1">중요도: {(payload[0].payload.z / 10).toFixed(1)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={networkData} fill="hsl(var(--primary))" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">
              * 버블 크기는 키워드의 중요도를 나타냅니다
            </p>
          </CardContent>
        </Card>
      )}

      {/* 주요 소비자 의견 */}
      {analysis.keyOpinions && analysis.keyOpinions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              주요 소비자 의견
            </CardTitle>
            <CardDescription>가장 많이 언급된 핵심 의견</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.keyOpinions.map((opinion, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex-1 text-foreground">{opinion.opinion}</p>
                    <div className="flex flex-col items-end gap-2">
                      <Badge style={{ backgroundColor: getSentimentColor(opinion.sentiment), color: 'white' }}>
                        {opinion.sentiment}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{opinion.frequency}회 언급</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 수집 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            게시글 수집 트렌드
          </CardTitle>
          <CardDescription>날짜별 게시글 수집 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
                name="게시글 수"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 주요 키워드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="w-5 h-5" />
            주요 키워드
          </CardTitle>
          <CardDescription>게시글에서 자주 등장한 키워드</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.topKeywords.map((keyword, index) => (
              <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                {keyword}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            전체 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{analysis.summary}</p>
        </CardContent>
      </Card>
    </div>
  );
}
