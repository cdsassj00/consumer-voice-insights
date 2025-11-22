import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, BarChart3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SearchResultData {
  totalFound: number;
  validResults: number;
  savedToDatabase: number;
}

const Index = () => {
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResultData | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast({
        title: "키워드를 입력하세요",
        description: "검색할 키워드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      toast({
        title: "검색 시작",
        description: `"${keyword}" 키워드로 한국 소비자 의견을 검색합니다...`,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-and-filter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keyword }),
        }
      );

      if (!response.ok) {
        throw new Error('검색 요청 실패');
      }

      const data = await response.json();
      
      setSearchResult(data);
      
      toast({
        title: "검색 완료",
        description: `총 ${data.totalFound}개 중 ${data.validResults}개의 실제 소비자 의견을 찾았습니다.`,
      });

      console.log('Search results:', data);
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

  const handleBatchProcess = async () => {
    if (!keyword.trim()) {
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

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-batch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keyword }),
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
            <div className="flex items-center justify-between">
              <div className="flex-1" />
              <h1 className="text-4xl font-bold text-foreground">
                한국 소비자 인사이트 플랫폼
              </h1>
              <div className="flex-1 flex justify-end">
                <Link to="/results">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    분석 결과 보기
                  </Button>
                </Link>
              </div>
            </div>
            <p className="text-lg text-muted-foreground">
              실제 소비자들의 솔직한 리뷰와 니즈를 분석합니다
            </p>
          </div>

          {/* Search Card */}
          <Card>
            <CardHeader>
              <CardTitle>키워드 검색</CardTitle>
              <CardDescription>
                검색하고 싶은 브랜드, 제품, 서비스명을 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="예: 삼성 갤럭시, 스타벅스, 현대 자동차..."
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
              
              <div className="text-sm text-muted-foreground">
                <p>💡 광고, 프로모션, 가십, 언론 기사는 제외하고</p>
                <p className="ml-5">실제 소비자들의 리뷰와 의견만 수집합니다</p>
              </div>
            </CardContent>
          </Card>

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
          {searchResult && searchResult.validResults > 0 && (
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
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleBatchProcess}
                    disabled={isProcessing}
                    className="flex-1"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        2차 분석 진행 중...
                      </>
                    ) : (
                      "2차 분석 시작 (Firecrawl + AI)"
                    )}
                  </Button>
                  
                  <Link to={`/results?keyword=${encodeURIComponent(keyword)}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="lg">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      결과 보기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
