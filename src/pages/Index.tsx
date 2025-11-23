import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, Settings, X, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";
import { KeywordManager } from "@/components/KeywordManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { HelpModal } from "@/components/HelpModal";
import { FirstStageAnalysis } from "@/components/FirstStageAnalysis";

interface SearchResultData {
  totalFound: number;
  validResults: number;
  savedToDatabase: number;
}

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

interface Keyword {
  id: string;
  category: string | null;
  keyword: string;
  is_active: boolean;
  is_favorite: boolean;
  search_count: number;
  last_searched_at: string | null;
  source: string;
}

const Index = () => {
  const [keyword, setKeyword] = useState("");
  const [selectedKeywordId, setSelectedKeywordId] = useState<string>("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [showKeywordManager, setShowKeywordManager] = useState(false);
  const [searchPeriod, setSearchPeriod] = useState("m3"); // 검색 기간 (기본값: 최근 3개월)
  const [searchMode, setSearchMode] = useState<'quick' | 'full'>('quick'); // 검색 모드
  const [firstStageAnalysis, setFirstStageAnalysis] = useState<any>(null);
  const [isAnalyzingFirstStage, setIsAnalyzingFirstStage] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResultData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      } else {
        fetchKeywords();
        fetchRecentSearchResults(); // 최근 1차 DB 결과 자동 로드
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // 검색 기간 변경 시 자동으로 결과 재필터링
  useEffect(() => {
    if (!session?.user || searchResults.length === 0) return;
    
    if (currentKeyword === "전체") {
      fetchRecentSearchResults();
    } else if (currentKeyword) {
      fetchSearchResults(currentKeyword);
    }
  }, [searchPeriod]); // searchPeriod 변경 감지

  // Realtime subscription for search results status updates
  useEffect(() => {
    if (!currentKeyword || !session?.user) return;
    
    const channel = supabase
      .channel('search-results-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'search_results',
          filter: `keyword=eq.${currentKeyword}`,
        },
        (payload) => {
          console.log('Search result status updated:', payload);
          setSearchResults(prev => 
            prev.map(r => r.id === payload.new.id 
              ? { ...r, status: payload.new.status as SearchResult['status'] } 
              : r
            )
          );
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentKeyword, session?.user]);

  const fetchKeywords = async () => {
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching keywords:', error);
      return;
    }

    setKeywords(data || []);
  };

  // 검색 기간을 날짜로 변환하는 함수
  const getDateFromPeriod = (period: string): Date => {
    const now = new Date();
    switch (period) {
      case 'd7':
        return new Date(now.setDate(now.getDate() - 7));
      case 'm1':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'm3':
        return new Date(now.setMonth(now.getMonth() - 3));
      case 'm6':
        return new Date(now.setMonth(now.getMonth() - 6));
      case 'y1':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setMonth(now.getMonth() - 3)); // 기본값: 3개월
    }
  };

  const fetchSearchResults = async (keyword: string) => {
    try {
      const { data, error } = await supabase
        .from('search_results')
        .select('*')
        .eq('keyword', keyword)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching search results:', error);
        return;
      }

      // article_published_at 기준으로 검색 기간 필터링
      const cutoffDate = getDateFromPeriod(searchPeriod);
      const filteredResults = (data || []).filter(result => {
        if (!result.article_published_at) {
          return true; // 날짜 정보가 없는 경우는 포함
        }
        const publishedDate = new Date(result.article_published_at);
        return publishedDate >= cutoffDate;
      });

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchRecentSearchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('search_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // 최근 50개 게시글 표시

      if (error) {
        console.error('Error fetching recent search results:', error);
        return;
      }

      // article_published_at 기준으로 검색 기간 필터링
      const cutoffDate = getDateFromPeriod(searchPeriod);
      const filteredResults = (data || []).filter(result => {
        if (!result.article_published_at) {
          return true; // 날짜 정보가 없는 경우는 포함
        }
        const publishedDate = new Date(result.article_published_at);
        return publishedDate >= cutoffDate;
      });

      setSearchResults(filteredResults);
      if (filteredResults && filteredResults.length > 0) {
        setCurrentKeyword("전체"); // 전체 결과 표시 중임을 나타냄
        // 1차 DB 결과 자동 분석 실행
        analyzeFirstStageResults(filteredResults);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const analyzeFirstStageResults = async (results: SearchResult[]) => {
    if (results.length === 0) return;
    
    setIsAnalyzingFirstStage(true);
    try {
      // Generate cache key from result IDs
      const { generateCacheKey } = await import('@/lib/cacheUtils');
      const resultIds = results.map(r => r.id);
      const cacheKey = generateCacheKey(resultIds);
      
      // Check if we have cached analysis for these exact results
      const { data: cachedAnalysis, error: cacheError } = await supabase
        .from('first_stage_analysis_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .eq('result_count', results.length)
        .maybeSingle();
      
      if (!cacheError && cachedAnalysis) {
        console.log('Using cached analysis');
        setFirstStageAnalysis(cachedAnalysis.analysis_data);
        toast({
          title: "분석 완료",
          description: "저장된 분석 결과를 불러왔습니다.",
        });
        return;
      }
      
      console.log('Performing new analysis');
      
      // 원본 게재일자 기준으로 날짜별 게시글 수 집계
      const dateCounts = results.reduce((acc, result) => {
        // article_published_at이 있는 경우에만 트렌드에 포함
        if (!result.article_published_at) {
          return acc;
        }

        const date = new Date(result.article_published_at);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
        acc[dateKey] = (acc[dateKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 최소/최대 날짜 찾기
      const dates = Object.keys(dateCounts).sort();
      if (dates.length === 0) {
        setFirstStageAnalysis(null);
        return;
      }

      const minDate = new Date(dates[0]);
      const maxDate = new Date(dates[dates.length - 1]);
      
      // 날짜 범위의 모든 날짜를 생성 (빈 날짜도 0으로 포함)
      const allDates: { date: string; count: number }[] = [];
      const currentDate = new Date(minDate);
      
      while (currentDate <= maxDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const displayDate = currentDate.toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric'
        });
        
        allDates.push({
          date: displayDate,
          count: dateCounts[dateKey] || 0
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const trendData = allDates.slice(-30); // 최근 30일만 표시

      const { data, error } = await supabase.functions.invoke('analyze-first-stage', {
        body: { 
          results: results.map(r => ({ 
            title: r.title, 
            snippet: r.snippet 
          })) 
        }
      });

      if (error) {
        console.error('Error analyzing first stage results:', error);
        toast({
          title: "분석 오류",
          description: "분석 중 오류가 발생했습니다.",
          variant: "destructive"
        });
        return;
      }

      const analysisWithTrend = { ...data, trendData };
      
      // Save to cache
      const { error: insertError } = await supabase
        .from('first_stage_analysis_cache')
        .insert({
          cache_key: cacheKey,
          keyword: currentKeyword || 'all',
          search_period: searchPeriod,
          result_count: results.length,
          analysis_data: analysisWithTrend,
          trend_data: trendData
        } as any);
      
      if (insertError) {
        console.error('Failed to cache analysis:', insertError);
        // Don't throw, just log - caching failure shouldn't break the flow
      }

      setFirstStageAnalysis(analysisWithTrend);
      toast({
        title: "분석 완료",
        description: "AI가 수집된 게시글 분석을 완료했습니다.",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "분석 오류",
        description: "분석 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingFirstStage(false);
    }
  };

  const handleSearch = async () => {
    const baseKeyword = selectedKeywordId 
      ? keywords.find(k => k.id === selectedKeywordId)?.keyword 
      : "";
    const additionalInput = keyword.trim();

    // 검색 쿼리 조합 로직: AND/OR 복합 조건
    let searchQuery = "";
    
    if (baseKeyword && additionalInput) {
      // 드롭다운 + 추가 키워드 → AND 조건
      const additionalTerms = additionalInput
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      if (additionalTerms.length > 1) {
        // 여러 개 → OR 조건으로 조합
        const orQuery = additionalTerms.join(' OR ');
        searchQuery = `${baseKeyword} (${orQuery})`;
      } else {
        // 하나만 → 단순 AND
        searchQuery = `${baseKeyword} ${additionalTerms[0]}`;
      }
    } else if (baseKeyword) {
      searchQuery = baseKeyword;
    } else if (additionalInput) {
      // 추가 입력만 있을 때도 콤마 처리
      const terms = additionalInput
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      searchQuery = terms.length > 1 ? terms.join(' OR ') : terms[0];
    } else {
      // 아무것도 입력 안 됨
      toast({
        title: "키워드를 입력하세요",
        description: "검색할 키워드를 선택하거나 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const searchKeyword = searchQuery;

    setIsSearching(true);
    
    try {
      // Auto-save keyword to search history (upsert)
      const { data: existingKeyword } = await supabase
        .from('keywords')
        .select('id, search_count')
        .eq('keyword', searchKeyword)
        .eq('user_id', session?.user.id)
        .maybeSingle();

      if (existingKeyword) {
        // Update existing keyword
        await supabase
          .from('keywords')
          .update({
            search_count: (existingKeyword.search_count || 0) + 1,
            last_searched_at: new Date().toISOString(),
          })
          .eq('id', existingKeyword.id);
      } else {
        // Insert new keyword with source: 'auto'
        await supabase
          .from('keywords')
          .insert({
            keyword: searchKeyword,
            user_id: session?.user.id,
            source: 'auto',
            search_count: 1,
            last_searched_at: new Date().toISOString(),
          });
      }

      // Refresh keywords list
      await fetchKeywords();

      toast({
        title: "검색 시작",
        description: `"${searchKeyword}" 키워드로 한국 소비자 의견을 검색합니다...`,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-and-filter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ 
            keyword: searchKeyword,
            searchPeriod: searchPeriod 
          }),
        }
      );

      if (!response.ok) {
        throw new Error('검색 요청 실패');
      }

      const data = await response.json();
      
      setSearchResult(data);
      setCurrentKeyword(searchKeyword);
      
      toast({
        title: "검색 완료",
        description: `총 ${data.totalFound}개 중 ${data.validResults}개의 실제 소비자 의견을 찾았습니다.`,
      });

      console.log('Search results:', data);

      // Fetch the filtered results
      await fetchSearchResults(searchKeyword);
      
      // Auto-trigger full analysis if in 'full' mode
      if (searchMode === 'full') {
        toast({
          title: "AI 전체 분석 시작",
          description: "검색 결과를 표시하는 동안 백그라운드에서 상세 분석이 진행됩니다...",
          duration: 5000,
        });
        
        // Start batch processing after a short delay
        setTimeout(() => {
          handleBatchProcess();
        }, 1000);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "검색 실패",
        description: "검색 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleBatchProcess = async (selectedIds?: string[]) => {
    if (!currentKeyword && !selectedIds) {
      toast({
        title: "키워드를 입력하세요",
        description: "분석할 키워드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      toast({
        title: "상세 분석 시작",
        description: "게시글 전문을 수집하고 AI가 심층 분석을 진행합니다...",
      });

      // Process selected items or all items for the keyword
      if (selectedIds && selectedIds.length > 0) {
        // Process specific items
        for (const id of selectedIds) {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crawl-and-analyze`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({ searchResultId: id }),
            }
          );

          if (!response.ok) {
            console.error(`Failed to process ${id}`);
          }

          // Add delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        toast({
          title: "상세 분석 완료",
          description: `${selectedIds.length}개 게시글 분석이 완료되었습니다.`,
        });
      } else {
        // Process all items for the keyword (original batch process)
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-batch`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ keyword: currentKeyword }),
          }
        );

        if (!response.ok) {
          throw new Error('배치 처리 요청 실패');
        }

        const data = await response.json();
        
        toast({
          title: "상세 분석 완료",
          description: `${data.total}개 중 ${data.succeeded}개 분석 완료, ${data.failed}개 실패`,
        });

        console.log('Batch processing results:', data);
      }

      // Refresh search results
      await fetchSearchResults(currentKeyword);
      
    } catch (error) {
      console.error('Batch processing error:', error);
      toast({
        title: "분석 실패",
        description: "상세 분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };


  // Calculate progress for full analysis
  const analyzedCount = searchResults.filter(r => r.status === 'analyzed').length;
  const progressPercentage = searchResults.length > 0 
    ? (analyzedCount / searchResults.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Progress Banner for Full Analysis */}
      {isProcessing && searchMode === 'full' && searchResults.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b shadow-lg">
          <div className="container mx-auto px-4 py-3">
            <Alert className="border-primary-blue/20 bg-primary-blue/5">
              <Loader2 className="h-5 w-5 animate-spin text-primary-blue" />
              <AlertTitle className="text-primary-blue">AI 상세 분석 진행 중</AlertTitle>
              <AlertDescription className="flex items-center gap-4 mt-2">
                <span className="text-sm">
                  {analyzedCount}/{searchResults.length} 게시글 완료
                </span>
                <Progress value={progressPercentage} className="flex-1 h-2" />
                <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      <div className={`container mx-auto px-4 ${isProcessing && searchMode === 'full' ? 'pt-32' : 'pt-12'} pb-12`}>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              한국 소비자 인사이트 플랫폼
            </h1>
            <p className="text-lg text-muted-foreground">
              실제 소비자들의 솔직한 리뷰와 니즈를 분석합니다
            </p>
          </div>

          {/* Search Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle>키워드 검색</CardTitle>
                  <CardDescription>
                    등록된 키워드를 선택하거나 직접 입력하세요
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <HelpModal />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKeywordManager(!showKeywordManager)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    키워드 관리
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 검색 모드 선택 */}
              <div className="p-4 bg-muted/30 rounded-lg border">
                <label className="text-sm font-medium text-foreground mb-3 block">검색 모드 선택:</label>
                <RadioGroup value={searchMode} onValueChange={(value) => setSearchMode(value as 'quick' | 'full')} className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-md border bg-background hover:bg-accent/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="quick" id="quick" />
                    <Label htmlFor="quick" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">빠른 검색</span>
                        <Badge variant="outline" className="text-xs">무료</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">검색 결과만 확인하고 원하는 게시글을 선택하여 분석</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-md border bg-background hover:bg-accent/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">전체 분석</span>
                        <Badge className="text-xs bg-primary-blue">프리미엄</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">검색 결과 + 자동으로 모든 게시글 AI 상세 분석</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 검색 기간 선택 */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-foreground">검색 기간:</label>
                <Select value={searchPeriod} onValueChange={setSearchPeriod}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="d7">최근 7일</SelectItem>
                    <SelectItem value="m1">최근 1개월</SelectItem>
                    <SelectItem value="m3">최근 3개월</SelectItem>
                    <SelectItem value="m6">최근 6개월</SelectItem>
                    <SelectItem value="y1">최근 1년</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  게시글 발행일 기준
                </span>
              </div>

              <div className="flex gap-2">
                {keywords.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Select value={selectedKeywordId} onValueChange={setSelectedKeywordId}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="등록된 키워드 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {keywords.map((kw) => (
                          <SelectItem key={kw.id} value={kw.id}>
                            {kw.category && `[${kw.category === 'brand' ? '브랜드' : kw.category === 'product' ? '제품' : kw.category === 'service' ? '서비스' : '기타'}] `}{kw.keyword}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedKeywordId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedKeywordId("")}
                        className="h-10 w-10 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                <Input
                  placeholder="추가 키워드 입력 (콤마로 구분 시 OR 조건)"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  size="lg"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isSearching ? "검색 중..." : "검색"}
                </Button>
              </div>
              
              {/* 검색 조건 미리보기 */}
              {(selectedKeywordId || keyword.trim()) && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium text-foreground mb-1">🔍 검색 조건 미리보기:</p>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const baseKeyword = selectedKeywordId 
                        ? keywords.find(k => k.id === selectedKeywordId)?.keyword 
                        : "";
                      const additionalInput = keyword.trim();
                      
                      if (baseKeyword && additionalInput) {
                        const terms = additionalInput.split(',').map(k => k.trim()).filter(k => k.length > 0);
                        if (terms.length > 1) {
                          return `"${baseKeyword}" AND (${terms.join(' OR ')})`;
                        }
                        return `"${baseKeyword}" AND ${terms[0]}`;
                      } else if (baseKeyword) {
                        return `"${baseKeyword}"`;
                      } else if (additionalInput) {
                        const terms = additionalInput.split(',').map(k => k.trim()).filter(k => k.length > 0);
                        return terms.length > 1 ? terms.join(' OR ') : terms[0];
                      }
                      return "";
                    })()}
                  </p>
                </div>
              )}

              <div className="text-sm text-muted-foreground space-y-1">
                <p>💡 <strong>검색 방법:</strong></p>
                <p className="ml-5">• 드롭다운 선택 + 추가 키워드 입력 = AND 조건</p>
                <p className="ml-5">• 추가 키워드에 콤마(,) 사용 = OR 조건</p>
                <p className="ml-5">• 광고, 프로모션, 가십, 언론 기사 자동 제외</p>
              </div>
            </CardContent>
          </Card>

          {/* Keyword Manager */}
        {showKeywordManager && session?.user && (
          <KeywordManager userId={session.user.id} />
        )}

          {/* First Stage Analysis */}
          {firstStageAnalysis && (
            <div className="mb-8">
              <FirstStageAnalysis 
                analysis={firstStageAnalysis} 
                trendData={firstStageAnalysis.trendData || []}
                searchResults={searchResults}
              />
            </div>
          )}

          {isAnalyzingFirstStage && (
            <div className="mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-foreground">AI가 수집된 게시글을 분석하고 있습니다...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search Results - Removed per user request */}
          {/* Statistics-only view with modals for article details */}

          {/* Summary Stats - only show if no detailed results yet */}
          {searchResult && searchResult.validResults > 0 && searchResults.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>검색 결과</CardTitle>
                <CardDescription>
                  1차 필터링이 완료되었습니다. 2차 분석을 시작하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {searchResult.totalFound}
                    </div>
                    <div className="text-sm text-muted-foreground">전체 검색 결과</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {searchResult.validResults}
                    </div>
                    <div className="text-sm text-muted-foreground">유효한 소비자 의견</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {searchResult.savedToDatabase}
                    </div>
                    <div className="text-sm text-muted-foreground">DB 저장 완료</div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleBatchProcess()}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  <Loader2 className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                  {isProcessing ? '분석 진행 중...' : '결과 새로고침'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
