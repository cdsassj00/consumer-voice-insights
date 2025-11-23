import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  Users, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle2,
  Crown,
  Sparkles
} from "lucide-react";

interface ConsumerPersona {
  name: string;
  demographics: string;
  painPoints: string[];
  desires: string[];
  behaviorPatterns: string;
}

interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  action: string;
  expectedImpact: string;
  timeframe: string;
}

interface AdvancedInsightsData {
  id: string;
  executive_summary: string;
  consumer_personas: ConsumerPersona[];
  competitive_landscape: {
    strengths: string[];
    weaknesses: string[];
    marketPosition: string;
    differentiators: string[];
  };
  action_items: ActionItem[];
  trend_predictions: {
    emerging: string[];
    declining: string[];
    stable: string[];
    forecast: string;
  };
  opportunities: string[];
  threats: string[];
  sentiment_trends: {
    overall: string;
    trajectory: string;
    keyDrivers: string[];
  };
  total_reviews_analyzed: number;
  overall_sentiment_score: number;
  created_at: string;
}

interface AdvancedInsightsPanelProps {
  insights: AdvancedInsightsData | null;
  isLoading: boolean;
  onGenerate: () => void;
}

export function AdvancedInsightsPanel({ insights, isLoading, onGenerate }: AdvancedInsightsPanelProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (!insights) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Crown className="w-16 h-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">프리미엄 고급 인사이트</CardTitle>
          <CardDescription className="text-base">
            AI가 모든 분석 결과를 종합하여 실행 가능한 비즈니스 인사이트를 제공합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-background rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="font-medium">소비자 페르소나</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="font-medium">경쟁 분석</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="font-medium">트렌드 예측</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="font-medium">액션 플랜</p>
            </div>
          </div>
          <Button 
            onClick={onGenerate} 
            disabled={isLoading}
            size="lg"
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                AI 분석 중...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                고급 인사이트 생성하기
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            ⚡ 일반적으로 30-60초 소요됩니다
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Badge */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Badge className="bg-gradient-to-r from-primary to-purple-600 text-lg py-2 px-4">
          <Crown className="w-5 h-5 mr-2" />
          프리미엄 고급 인사이트
        </Badge>
      </div>

      {/* Executive Summary */}
      <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            경영진 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{insights.executive_summary}</p>
          <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
            <span>📊 분석 게시글: {insights.total_reviews_analyzed}개</span>
            <span>⭐ 종합 감성 점수: {(insights.overall_sentiment_score * 100).toFixed(0)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Consumer Personas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            소비자 페르소나 분석
          </CardTitle>
          <CardDescription>주요 타겟 고객 유형</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {insights.consumer_personas.map((persona, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div>
                  <h4 className="font-semibold text-lg">{persona.name}</h4>
                  <p className="text-sm text-muted-foreground">{persona.demographics}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">❌ 불만 사항</p>
                  <ul className="text-sm space-y-1">
                    {persona.painPoints.map((point, i) => (
                      <li key={i} className="ml-4">• {point}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">✅ 원하는 것</p>
                  <ul className="text-sm space-y-1">
                    {persona.desires.map((desire, i) => (
                      <li key={i} className="ml-4">• {desire}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">🔄 행동 패턴</p>
                  <p className="text-sm">{persona.behaviorPatterns}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Competitive Landscape */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            경쟁 환경 분석
          </CardTitle>
          <CardDescription>시장 내 포지셔닝 및 경쟁력</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">🎯 시장 포지셔닝</p>
            <p className="text-sm bg-muted/30 p-3 rounded">{insights.competitive_landscape.marketPosition}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2 text-green-600">💪 강점</p>
              <ul className="text-sm space-y-1">
                {insights.competitive_landscape.strengths.map((strength, i) => (
                  <li key={i} className="ml-4">• {strength}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2 text-red-600">⚠️ 약점</p>
              <ul className="text-sm space-y-1">
                {insights.competitive_landscape.weaknesses.map((weakness, i) => (
                  <li key={i} className="ml-4">• {weakness}</li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">🌟 차별화 요소</p>
            <div className="flex flex-wrap gap-2">
              {insights.competitive_landscape.differentiators.map((diff, i) => (
                <Badge key={i} variant="secondary">{diff}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            비즈니스 액션 아이템
          </CardTitle>
          <CardDescription>우선순위별 실행 방안</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.action_items.map((item, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(item.priority)}`}></div>
                    <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}>
                      {item.priority === 'high' ? '높음' : item.priority === 'medium' ? '중간' : '낮음'}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-xs">{item.timeframe}</Badge>
                </div>
                <p className="font-medium">{item.action}</p>
                <p className="text-sm text-muted-foreground">💡 기대 효과: {item.expectedImpact}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trends & Opportunities */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Trend Predictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              트렌드 예측
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-green-600 mb-1">📈 부상 중</p>
              <ul className="text-sm space-y-1">
                {insights.trend_predictions.emerging.map((trend, i) => (
                  <li key={i} className="ml-4">• {trend}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-red-600 mb-1">📉 하락 중</p>
              <ul className="text-sm space-y-1">
                {insights.trend_predictions.declining.map((trend, i) => (
                  <li key={i} className="ml-4">• {trend}</li>
                ))}
              </ul>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs font-medium mb-1">🔮 전망</p>
              <p className="text-sm">{insights.trend_predictions.forecast}</p>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities & Threats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              기회 & 위협
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-green-600 mb-1">✅ 기회</p>
              <ul className="text-sm space-y-1">
                {insights.opportunities.map((opp, i) => (
                  <li key={i} className="ml-4">• {opp}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-red-600 mb-1">⚠️ 위협</p>
              <ul className="text-sm space-y-1">
                {insights.threats.map((threat, i) => (
                  <li key={i} className="ml-4">• {threat}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            감성 트렌드 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded">
              <p className="text-xs text-muted-foreground mb-1">전반적 평가</p>
              <p className="text-sm font-medium">{insights.sentiment_trends.overall}</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded">
              <p className="text-xs text-muted-foreground mb-1">변화 추이</p>
              <p className="text-sm font-medium">{insights.sentiment_trends.trajectory}</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded">
              <p className="text-xs text-muted-foreground mb-1">분석 기간</p>
              <p className="text-sm font-medium">{new Date(insights.created_at).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">🎯 핵심 영향 요인</p>
            <div className="flex flex-wrap gap-2">
              {insights.sentiment_trends.keyDrivers.map((driver, i) => (
                <Badge key={i} variant="outline">{driver}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={onGenerate}
          disabled={isLoading}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          인사이트 재생성
        </Button>
      </div>
    </div>
  );
}
