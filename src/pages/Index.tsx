import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, RefreshCw, Settings, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";
import { SearchResultsList } from "@/components/SearchResultsList";
import { KeywordManager } from "@/components/KeywordManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSearch = async () => {
    const searchKeyword = selectedKeywordId 
      ? keywords.find(k => k.id === selectedKeywordId)?.keyword 
      : keyword.trim();

    if (!searchKeyword) {
      toast({
        title: "키워드를 선택하거나 입력하세요",
        description: "검색할 키워드를 선택하거나 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

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
          body: JSON.stringify({ keyword: searchKeyword }),
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
        title: "2차 분석 시작",
        description: "Firecrawl로 전문을 수집하고 AI가 상세 분석을 진행합니다...",
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
          title: "2차 분석 완료",
          description: `${selectedIds.length}개 항목 분석이 완료되었습니다.`,
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
          title: "2차 분석 완료",
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
        description: "2차 분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKeywordManager(!showKeywordManager)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  키워드 관리
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  placeholder="또는 직접 입력 (예: 삼성 갤럭시)"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setSelectedKeywordId("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                  disabled={!!selectedKeywordId}
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
              
              <div className="text-sm text-muted-foreground">
                <p>💡 광고, 프로모션, 가십, 언론 기사는 제외하고</p>
                <p className="ml-5">실제 소비자들의 리뷰와 의견만 수집합니다</p>
              </div>
            </CardContent>
          </Card>

          {/* Keyword Manager */}
        {showKeywordManager && session?.user && (
          <KeywordManager userId={session.user.id} />
        )}

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1단계</CardTitle>
                <CardDescription>
                  Google Search로 한국 커뮤니티 사이트에서 관련 게시글 검색
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2단계</CardTitle>
                <CardDescription>
                  AI 필터링으로 실제 소비자 리뷰만 선별 및 전문 크롤링
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3단계</CardTitle>
                <CardDescription>
                  AI 분석 및 시각화로 인사이트 도출
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <SearchResultsList
              results={searchResults}
              onAnalyze={handleBatchProcess}
              isProcessing={isProcessing}
            />
          )}

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
                  <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
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
