import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
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
        </div>
      </div>
    </div>
  );
};

export default Index;
