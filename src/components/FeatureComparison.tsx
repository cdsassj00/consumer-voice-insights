import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, Crown, Sparkles } from "lucide-react";

export function FeatureComparison() {
  const features = [
    {
      category: "플랫폼 차별점",
      items: [
        { name: "일반 키워드 검색", quick: "❌ 사이트 리뷰만 수집", full: "❌ 사이트 리뷰만 수집" },
        { name: "리얼 VOC 플랫폼", quick: "✅ 소비자 커뮤니티 수집", full: "✅ 소비자 커뮤니티 + AI 분석" },
        { name: "데이터 출처", quick: "커뮤니티 게시판 (진짜 소비자 의견)", full: "커뮤니티 게시판 (진짜 소비자 의견)" },
      ]
    },
    {
      category: "기본 기능",
      items: [
        { name: "AI 데이터베이스 분석", quick: true, full: true },
        { name: "감성 분석 & 키워드 추출", quick: true, full: true },
        { name: "네트워크 그래프 시각화", quick: true, full: true },
        { name: "카테고리별 분석", quick: true, full: true },
      ]
    },
    {
      category: "고급 분석",
      items: [
        { name: "2차 상세 크롤링 & 전문 분석", quick: false, full: true },
        { name: "소비자 페르소나 분석", quick: false, full: true },
        { name: "경쟁사 비교 분석", quick: false, full: true },
        { name: "비즈니스 액션 아이템 제공", quick: false, full: true },
        { name: "트렌드 예측 & 기회 분석", quick: false, full: true },
      ]
    },
    {
      category: "데이터 활용",
      items: [
        { name: "검색 결과 개수", quick: "제한적", full: "무제한" },
        { name: "분석 결과 내보내기 (CSV/Excel)", quick: false, full: true },
        { name: "장기 트렌드 분석", quick: "7일", full: "6개월+" },
      ]
    }
  ];

  return (
    <Card className="w-full bg-gradient-to-br from-background via-background to-muted/20 border-2">
      <CardHeader>
        <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <h3 className="font-semibold text-primary flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            💎 왜 이 플랫폼이 특별한가요?
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">일반 검색 엔진:</strong> 공식 사이트 리뷰만 수집 → 기업이 관리하는 평가만 보임
            </p>
            <p>
              <strong className="text-foreground">우리 플랫폼:</strong> 소비자 커뮤니티 게시판 직접 수집 → <strong className="text-primary">진짜 소비자들의 솔직한 의견</strong>
            </p>
            <p className="pt-2 border-t">
              💬 <strong className="text-foreground">Real VOC(Voice of Customer)</strong>: 소비자들이 실제로 토로하는 불만, 칭찬, 니즈를 수집합니다.
            </p>
          </div>
        </div>
        <CardTitle className="text-xl flex items-center justify-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          빠른 검색 vs 전체 분석
          <Crown className="w-5 h-5 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Header Row */}
          <div className="grid grid-cols-3 gap-4 pb-4 border-b">
            <div className="col-span-1"></div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                <Zap className="w-3 h-3 mr-1" />
                빠른 검색
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">무료</p>
            </div>
            <div className="text-center">
              <Badge className="mb-2 bg-gradient-to-r from-primary to-purple-600">
                <Crown className="w-3 h-3 mr-1" />
                전체 분석
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">프리미엄</p>
            </div>
          </div>

          {/* Feature Rows */}
          {features.map((category, catIdx) => (
            <div key={catIdx} className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="grid grid-cols-3 gap-4 items-center py-2 hover:bg-muted/30 rounded-lg px-2 transition-colors">
                    <div className="col-span-1 text-sm">{item.name}</div>
                    <div className="text-center">
                      {typeof item.quick === 'boolean' ? (
                        item.quick ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">{item.quick}</span>
                      )}
                    </div>
                    <div className="text-center">
                      {typeof item.full === 'boolean' ? (
                        item.full ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                        )
                      ) : (
                        <span className="text-xs font-medium text-primary">{item.full}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <Card className="bg-muted/50">
              <CardContent className="pt-4 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-semibold mb-1">빠른 검색</p>
                <p className="text-xs text-muted-foreground">
                  즉시 확인 가능한 기본 인사이트
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
              <CardContent className="pt-4 text-center">
                <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-sm font-semibold mb-1">전체 분석</p>
                <p className="text-xs text-muted-foreground">
                  심층 분석 + 비즈니스 액션 플랜
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Pro Tip:</strong> 전체 분석은 백그라운드에서 자동 실행되어 완료 시 "분석 결과" 메뉴에서 확인하실 수 있습니다.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
