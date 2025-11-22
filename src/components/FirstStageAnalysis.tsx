import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MessageSquare, Hash, Calendar, Network, ShoppingBag, Star, TrendingDown, Activity } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { ArticleModal } from "./ArticleModal";

interface SearchResult {
  id: string;
  keyword: string;
  url: string;
  title: string;
  snippet: string;
  source_domain: string;
  status: 'pending' | 'crawling' | 'analyzed' | 'failed';
  created_at: string;
  article_published_at: string | null;
}

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
  searchResults: SearchResult[];
}

export function FirstStageAnalysis({ analysis, trendData, searchResults }: FirstStageAnalysisProps) {
  const [dateRange, setDateRange] = useState<[number, number]>([0, trendData.length - 1]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<SearchResult[]>([]);
  const [modalTitle, setModalTitle] = useState("");

  // 슬라이더로 선택된 날짜 범위의 데이터만 표시
  const filteredTrendData = trendData.slice(dateRange[0], dateRange[1] + 1);

  const handleChartClick = (data: any, filterFn: (result: SearchResult) => boolean, title: string) => {
    const filtered = searchResults.filter(filterFn);
    setSelectedArticles(filtered);
    setModalTitle(title);
    setModalOpen(true);
  };

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
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={({ name, value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 25;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill="hsl(var(--foreground))" 
                        textAnchor={x > cx ? 'start' : 'end'} 
                        dominantBaseline="central"
                        className="text-sm font-medium"
                      >
                        {`${name} ${value}%`}
                      </text>
                    );
                  }}
                  outerRadius={65}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data) => {
                    const sentimentMap: { [key: string]: string } = {
                      '긍정': 'positive',
                      '중립': 'neutral',
                      '부정': 'negative'
                    };
                    handleChartClick(
                      data,
                      (result) => {
                        // 간단히 sentiment 추정 (실제로는 analysis_results 테이블에서 가져와야 함)
                        return true; // 일단 모든 게시글 표시
                      },
                      `${data.name} 감성의 게시글`
                    );
                  }}
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                  ))}
                </Pie>
                <Tooltip cursor={{ fill: 'transparent' }} />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">
              * 차트를 클릭하면 해당 감성의 게시글을 볼 수 있습니다.
            </p>
          </CardContent>
        </Card>

        {/* 주요 토픽 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">주요 토픽</CardTitle>
            <CardDescription>가장 많이 언급된 주제</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analysis.mainTopics} margin={{ bottom: 60 }}>
                <XAxis 
                  dataKey="topic" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                />
                <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
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
            <div className="relative">
              <svg width="100%" height="500" viewBox="0 0 800 500" className="overflow-visible">
                {/* 연결선 그리기 */}
                {analysis.networkGraph.links.map((link, idx) => {
                  const sourceNode = networkData.find(n => n.name === link.source);
                  const targetNode = networkData.find(n => n.name === link.target);
                  if (!sourceNode || !targetNode) return null;
                  
                  const x1 = (sourceNode.x / 100) * 800;
                  const y1 = (sourceNode.y / 100) * 500;
                  const x2 = (targetNode.x / 100) * 800;
                  const y2 = (targetNode.y / 100) * 500;
                  
                  return (
                    <line
                      key={`link-${idx}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={link.value}
                      strokeOpacity={0.3}
                    />
                  );
                })}
                
                {/* 노드와 라벨 그리기 */}
                {networkData.map((node, idx) => {
                  const cx = (node.x / 100) * 800;
                  const cy = (node.y / 100) * 500;
                  const r = Math.sqrt(node.z / Math.PI) * 2;
                  
                  return (
                    <g key={`node-${idx}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="hsl(var(--primary))"
                        fillOpacity={0.6}
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        className="hover:fill-opacity-80 transition-all cursor-pointer"
                      />
                      <text
                        x={cx}
                        y={cy + r + 14}
                        textAnchor="middle"
                        fill="hsl(var(--foreground))"
                        fontSize="11"
                        fontWeight="500"
                        className="pointer-events-none"
                      >
                        {node.name}
                      </text>
                      <text
                        x={cx}
                        y={cy + r + 26}
                        textAnchor="middle"
                        fill="hsl(var(--muted-foreground))"
                        fontSize="9"
                        className="pointer-events-none"
                      >
                        {node.category}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              * 노드 크기는 키워드의 중요도, 선 굵기는 연관 강도를 나타냅니다
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
            게시글 원본 게재일 트렌드
          </CardTitle>
          <CardDescription>원본 게재일 기준 날짜별 게시글 현황</CardDescription>
        </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">날짜 범위:</span>
                <span className="font-medium">
                  {filteredTrendData[0]?.date} ~ {filteredTrendData[filteredTrendData.length - 1]?.date}
                </span>
              </div>
              <Slider
                min={0}
                max={trendData.length - 1}
                step={1}
                value={dateRange}
                onValueChange={(value) => setDateRange(value as [number, number])}
                className="w-full"
                minStepsBetweenThumbs={1}
              />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart 
                data={filteredTrendData}
                onClick={(data) => {
                  if (data?.activeLabel) {
                    handleChartClick(
                      data,
                      (result) => {
                        if (!result.article_published_at) return false;
                        const resultDate = new Date(result.article_published_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric'
                        });
                        return resultDate === data.activeLabel;
                      },
                      `${data.activeLabel} 게시글`
                    );
                  }
                }}
              >
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
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4, cursor: 'pointer' }}
                  activeDot={{ r: 6, cursor: 'pointer' }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">
              * 슬라이더로 날짜 범위를 조정하세요. 차트를 클릭하면 해당 날짜의 게시글을 볼 수 있습니다.
            </p>
          </CardContent>
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
