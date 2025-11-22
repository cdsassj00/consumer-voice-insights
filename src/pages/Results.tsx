import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, ExternalLink, LogOut, Filter, X, Calendar, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/DateRangePicker";
import { subDays, subMonths, startOfDay, endOfDay, format } from "date-fns";

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
    article_published_at: string | null;
    created_at: string;
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
  const [allResults, setAllResults] = useState<AnalysisResult[]>([]); // 전체 결과 저장
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      fetchResults();
    }
  }, [keyword, session]);

  // Apply date range filter when dateRange changes
  useEffect(() => {
    if (!dateRange?.from && !dateRange?.to) {
      // No filter - show all results
      setResults(allResults);
      return;
    }

    const filtered = allResults.filter((result) => {
      const articleDate = result.search_results.article_published_at 
        ? new Date(result.search_results.article_published_at)
        : new Date(result.search_results.created_at);
      
      if (dateRange.from && dateRange.to) {
        // Range filter
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return articleDate >= fromDate && articleDate <= toDate;
      } else if (dateRange.from) {
        // Only from date
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        return articleDate >= fromDate;
      }
      return true;
    });

    setResults(filtered);
  }, [dateRange, allResults]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "로그아웃 완료",
      description: "로그아웃되었습니다.",
    });
  };

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
            source_domain,
            article_published_at,
            created_at
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

      const typedData = data as AnalysisResult[];
      setAllResults(typedData); // Store all results
      setResults(typedData); // Initially show all
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearDateFilter = () => {
    setDateRange(undefined);
  };

  // Quick date range selection helpers
  const setQuickDateRange = (range: 'today' | '7days' | '1month' | '3months') => {
    const now = new Date();
    const end = endOfDay(now);
    let start: Date;

    switch (range) {
      case 'today':
        start = startOfDay(now);
        break;
      case '7days':
        start = startOfDay(subDays(now, 7));
        break;
      case '1month':
        start = startOfDay(subMonths(now, 1));
        break;
      case '3months':
        start = startOfDay(subMonths(now, 3));
        break;
    }

    setDateRange({ from: start, to: end });
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

  // CSV 다운로드 함수
  const downloadCSV = () => {
    const headers = [
      '제목',
      'URL',
      '도메인',
      '발행일',
      '키워드',
      '감성',
      '카테고리',
      '요약',
      '주요 토픽',
      '제품명',
      '브랜드명',
      '가격 논의',
      '추천 수준',
      '주요 이슈',
      '주요 칭찬'
    ];

    const rows = results.map(result => [
      result.search_results.title,
      result.search_results.url,
      result.search_results.source_domain,
      result.search_results.article_published_at 
        ? format(new Date(result.search_results.article_published_at), 'yyyy-MM-dd')
        : format(new Date(result.search_results.created_at), 'yyyy-MM-dd'),
      result.search_results.keyword,
      SENTIMENT_LABELS[result.sentiment],
      result.category || '',
      result.summary || '',
      (result.key_topics || []).join(', '),
      result.structured_data?.productMentioned || '',
      result.structured_data?.brandMentioned || '',
      result.structured_data?.priceDiscussed ? '예' : '아니오',
      result.structured_data?.recommendationLevel?.toString() || '',
      (result.structured_data?.mainIssues || []).join(', '),
      (result.structured_data?.mainPraises || []).join(', ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `분석결과_${keyword || '전체'}_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV 다운로드 완료",
      description: `${results.length}개의 분석 결과가 다운로드되었습니다.`,
    });
  };

  // Excel 다운로드 함수
  const downloadExcel = () => {
    const data = results.map(result => ({
      '제목': result.search_results.title,
      'URL': result.search_results.url,
      '도메인': result.search_results.source_domain,
      '발행일': result.search_results.article_published_at 
        ? format(new Date(result.search_results.article_published_at), 'yyyy-MM-dd')
        : format(new Date(result.search_results.created_at), 'yyyy-MM-dd'),
      '키워드': result.search_results.keyword,
      '감성': SENTIMENT_LABELS[result.sentiment],
      '카테고리': result.category || '',
      '요약': result.summary || '',
      '주요 토픽': (result.key_topics || []).join(', '),
      '제품명': result.structured_data?.productMentioned || '',
      '브랜드명': result.structured_data?.brandMentioned || '',
      '가격 논의': result.structured_data?.priceDiscussed ? '예' : '아니오',
      '추천 수준': result.structured_data?.recommendationLevel?.toString() || '',
      '주요 이슈': (result.structured_data?.mainIssues || []).join(', '),
      '주요 칭찬': (result.structured_data?.mainPraises || []).join(', ')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '분석 결과');

    // 컬럼 너비 자동 조정
    const maxWidth = 50;
    const wscols = Object.keys(data[0] || {}).map(key => ({
      wch: Math.min(maxWidth, Math.max(
        key.length,
        ...data.map(row => String(row[key as keyof typeof row] || '').length)
      ))
    }));
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `분석결과_${keyword || '전체'}_${format(new Date(), 'yyyyMMdd')}.xlsx`);

    toast({
      title: "Excel 다운로드 완료",
      description: `${results.length}개의 분석 결과가 다운로드되었습니다.`,
    });
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
          <div className="flex justify-between items-center">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                검색으로 돌아가기
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadCSV}
                disabled={results.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV 다운로드
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadExcel}
                disabled={results.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Excel 다운로드
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
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

            {/* Date Range Filter */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Quick Selection Buttons */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium">빠른 선택:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickDateRange('today')}
                        className="text-xs"
                      >
                        오늘
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickDateRange('7days')}
                        className="text-xs"
                      >
                        최근 7일
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickDateRange('1month')}
                        className="text-xs"
                      >
                        최근 1개월
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickDateRange('3months')}
                        className="text-xs"
                      >
                        최근 3개월
                      </Button>
                    </div>
                  </div>

                  {/* Custom Date Range Picker */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium">사용자 지정:</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <DateRangePicker
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        className="flex-1 md:max-w-md"
                      />
                      {dateRange && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={clearDateFilter}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {dateRange?.from || dateRange?.to ? (
                        <span>필터링된 결과: <strong className="text-foreground">{results.length}</strong>개 / 전체: {allResults.length}개</span>
                      ) : (
                        <span>전체 결과: <strong className="text-foreground">{results.length}</strong>개</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  💡 게시글 발행일(article_published_at) 기준으로 필터링됩니다. 발행일이 없는 경우 수집일(created_at) 기준으로 필터링됩니다.
                </p>
              </CardContent>
            </Card>
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
                      <CardDescription className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span>{result.search_results.source_domain}</span>
                          <a 
                            href={result.search_results.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {result.search_results.article_published_at 
                            ? format(new Date(result.search_results.article_published_at), 'yyyy-MM-dd')
                            : format(new Date(result.search_results.created_at), 'yyyy-MM-dd')} 발행
                        </span>
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
