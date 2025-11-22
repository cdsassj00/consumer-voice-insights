import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalysisResult {
  id: string;
  search_result_id: string;
  is_consumer_review: boolean;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  category: string;
  key_topics: string[];
  structured_data: {
    productMentioned?: string;
    brandMentioned?: string;
    priceDiscussed?: boolean;
    recommendationLevel?: number;
    mainIssues?: string[];
    mainPraises?: string[];
  };
  summary: string;
  created_at: string;
  search_results: {
    keyword: string;
    url: string;
    title: string;
    source_domain: string;
  };
}

const SENTIMENT_COLORS = {
  positive: 'hsl(var(--chart-1))',
  negative: 'hsl(var(--chart-2))',
  neutral: 'hsl(var(--chart-3))',
  mixed: 'hsl(var(--chart-4))',
};

const SENTIMENT_LABELS = {
  positive: '긍정',
  negative: '부정',
  neutral: '중립',
  mixed: '복합',
};

const Results = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword');
  
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [keyword]);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('analysis_results')
        .select(`
          *,
          search_results (
            keyword,
            url,
            title,
            source_domain
          )
        `)
        .eq('is_consumer_review', true)
        .order('created_at', { ascending: false });

      if (keyword) {
        query = query.eq('search_results.keyword', keyword);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching results:', error);
        return;
      }

      setResults(data as AnalysisResult[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate sentiment distribution
  const sentimentData = Object.entries(
    results.reduce((acc, r) => {
      acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([sentiment, count]) => ({
    name: SENTIMENT_LABELS[sentiment as keyof typeof SENTIMENT_LABELS],
    value: count,
    sentiment: sentiment,
  }));

  // Calculate category distribution
  const categoryData = Object.entries(
    results.reduce((acc, r) => {
      if (r.category) {
        acc[r.category] = (acc[r.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Extract all topics
  const allTopics = results.flatMap(r => r.key_topics || []);
  const topicFrequency = allTopics.reduce((acc, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTopics = Object.entries(topicFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-7xl space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              검색으로 돌아가기
            </Button>
          </Link>
          
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              분석 결과 대시보드
            </h1>
            {keyword && (
              <p className="text-lg text-muted-foreground mt-2">
                키워드: <span className="font-semibold text-foreground">{keyword}</span>
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <Card className="flex-1">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-foreground">{results.length}</div>
                <div className="text-sm text-muted-foreground">총 분석 완료</div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-500">
                  {results.filter(r => r.sentiment === 'positive').length}
                </div>
                <div className="text-sm text-muted-foreground">긍정적 리뷰</div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-red-500">
                  {results.filter(r => r.sentiment === 'negative').length}
                </div>
                <div className="text-sm text-muted-foreground">부정적 리뷰</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sentiment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>감성 분석 분포</CardTitle>
              <CardDescription>소비자 의견의 전반적인 감성</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.sentiment as keyof typeof SENTIMENT_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>카테고리 분포</CardTitle>
              <CardDescription>상위 10개 카테고리</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Topics */}
        <Card>
          <CardHeader>
            <CardTitle>주요 토픽</CardTitle>
            <CardDescription>가장 많이 언급된 주제들</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topTopics.map(([topic, count]) => (
                <Badge key={topic} variant="secondary" className="text-sm">
                  {topic} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results List */}
        <Card>
          <CardHeader>
            <CardTitle>상세 분석 결과</CardTitle>
            <CardDescription>각 게시글별 분석 내용</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="border-l-4" style={{
                borderLeftColor: SENTIMENT_COLORS[result.sentiment]
              }}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(result.sentiment)}
                        <CardTitle className="text-lg">
                          {result.search_results.title}
                        </CardTitle>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <span>{result.search_results.source_domain}</span>
                        <a 
                          href={result.search_results.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {SENTIMENT_LABELS[result.sentiment]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-foreground">{result.summary}</p>
                  
                  {result.key_topics && result.key_topics.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">주요 토픽:</div>
                      <div className="flex flex-wrap gap-1">
                        {result.key_topics.map((topic, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.structured_data && (
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {result.structured_data.productMentioned && (
                        <div>
                          <span className="font-medium">제품:</span> {result.structured_data.productMentioned}
                        </div>
                      )}
                      {result.structured_data.brandMentioned && (
                        <div>
                          <span className="font-medium">브랜드:</span> {result.structured_data.brandMentioned}
                        </div>
                      )}
                      {result.structured_data.recommendationLevel && (
                        <div>
                          <span className="font-medium">추천도:</span> {result.structured_data.recommendationLevel}/5
                        </div>
                      )}
                    </div>
                  )}

                  {result.structured_data?.mainPraises && result.structured_data.mainPraises.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-green-600 mb-1">👍 주요 장점:</div>
                      <ul className="text-sm list-disc list-inside text-muted-foreground">
                        {result.structured_data.mainPraises.map((praise, idx) => (
                          <li key={idx}>{praise}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.structured_data?.mainIssues && result.structured_data.mainIssues.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-red-600 mb-1">👎 주요 문제점:</div>
                      <ul className="text-sm list-disc list-inside text-muted-foreground">
                        {result.structured_data.mainIssues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;
