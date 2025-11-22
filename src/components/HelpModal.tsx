import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Search, Sparkles, TrendingUp, Zap, Crown, Building2 } from "lucide-react";

export const HelpModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="w-4 h-4" />
          도움말
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">플랫폼 사용 가이드</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* 서비스 소개 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Search className="w-5 h-5 text-primary-blue" />
              서비스 소개
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              한국 소비자 인사이트 플랫폼은 기업이 실제 소비자들의 진짜 목소리를 듣기 위한 전문 분석 도구입니다. 
              광고, 프로모션, 가십, 언론 기사를 자동으로 제외하고 순수한 소비자 리뷰와 니즈만을 수집·분석하여 
              비즈니스 의사결정에 필요한 인사이트를 제공합니다.
            </p>
          </div>

          {/* 검색 가이드 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-blue" />
              검색 가이드
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
              <div>
                <p className="font-medium text-foreground mb-1">🔍 검색 조건 설정</p>
                <ul className="space-y-1 ml-4 text-muted-foreground">
                  <li>• <strong>드롭다운 선택 + 추가 키워드</strong> = AND 조건 (예: "삼성 갤럭시" AND "배터리")</li>
                  <li>• <strong>콤마(,)로 구분</strong> = OR 조건 (예: "배터리, 디스플레이, 카메라" → OR)</li>
                  <li>• <strong>검색 기간</strong>: 최근 7일 ~ 1년까지 선택 가능 (게시글 발행일 기준)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">🎯 검색 모드</p>
                <ul className="space-y-1 ml-4 text-muted-foreground">
                  <li>• <strong>빠른 검색 (무료)</strong>: AI가 선별한 검색 결과만 확인</li>
                  <li>• <strong>전체 분석 (프리미엄)</strong>: 검색 결과 + 자동으로 모든 게시글 상세 분석</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 분석 프로세스 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-blue" />
              분석 프로세스
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              <Card className="border-primary-blue/20">
                <CardHeader className="pb-3">
                  <div className="w-8 h-8 rounded-full bg-primary-blue/10 flex items-center justify-center mb-2">
                    <span className="text-primary-blue font-bold">1</span>
                  </div>
                  <CardTitle className="text-base">검색 & 수집</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Google Search API로 한국 주요 커뮤니티 사이트에서 관련 게시글 검색
                </CardContent>
              </Card>
              
              <Card className="border-primary-blue/20">
                <CardHeader className="pb-3">
                  <div className="w-8 h-8 rounded-full bg-primary-blue/10 flex items-center justify-center mb-2">
                    <span className="text-primary-blue font-bold">2</span>
                  </div>
                  <CardTitle className="text-base">AI 필터링</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  LLM이 광고·프로모션·가십·뉴스를 제외하고 실제 소비자 의견만 선별
                </CardContent>
              </Card>
              
              <Card className="border-primary-blue/20">
                <CardHeader className="pb-3">
                  <div className="w-8 h-8 rounded-full bg-primary-blue/10 flex items-center justify-center mb-2">
                    <span className="text-primary-blue font-bold">3</span>
                  </div>
                  <CardTitle className="text-base">상세 분석</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  게시글 전문 수집 후 감성·토픽·인사이트 분석 및 리포트 생성
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 티어별 기능 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary-blue" />
              티어별 기능
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Free Tier */}
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">Free</Badge>
                  </div>
                  <CardTitle className="text-lg">무료 플랜</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 빠른 검색 (검색 결과만)
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 최근 7일 데이터
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 월 10회 검색
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 수동 상세 분석 (건당)
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-red-600">✗</span> 자동 AI 전체 분석
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-red-600">✗</span> 리포트 다운로드
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" size="sm">
                    현재 플랜
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Tier */}
              <Card className="border-2 border-primary-blue bg-primary-blue/5">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary-blue" />
                    <Badge className="text-xs bg-primary-blue">Pro</Badge>
                  </div>
                  <CardTitle className="text-lg">프리미엄 플랜</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 전체 분석 (자동 AI 분석)
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 최근 3개월 데이터
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 월 100회 검색
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 실시간 분석 알림
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 리포트 다운로드 (PDF)
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 우선 고객 지원
                    </p>
                  </div>
                  <Button className="w-full bg-primary-blue hover:bg-primary-blue/90" size="sm">
                    업그레이드
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Tier */}
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-foreground" />
                    <Badge variant="secondary" className="text-xs">Enterprise</Badge>
                  </div>
                  <CardTitle className="text-lg">기업 플랜</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 무제한 검색 & 분석
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 최근 1년 데이터
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> API 접근 권한
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 커스텀 리포트 템플릿
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> 전담 계정 매니저
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-green-600">✓</span> SLA 보장
                    </p>
                  </div>
                  <Button variant="secondary" className="w-full" size="sm">
                    문의하기
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="bg-muted/30 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium text-foreground">📌 참고 사항</p>
            <ul className="space-y-1 ml-4 text-muted-foreground">
              <li>• 검색 및 분석 결과는 실시간으로 업데이트됩니다</li>
              <li>• 분석 완료 시 알림을 통해 즉시 확인 가능합니다</li>
              <li>• 모든 데이터는 암호화되어 안전하게 저장됩니다</li>
              <li>• 티어 업그레이드는 언제든지 가능하며, 즉시 적용됩니다</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
