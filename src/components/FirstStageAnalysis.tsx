import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MessageSquare, Hash, Calendar } from "lucide-react";

interface FirstStageAnalysisProps {
  analysis: {
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
    topKeywords: string[];
    mainTopics: Array<{ topic: string; count: number }>;
    summary: string;
  };
  trendData: Array<{ date: string; count: number }>;
}

export function FirstStageAnalysis({ analysis, trendData }: FirstStageAnalysisProps) {
  const sentimentData = [
    { name: "긍정", value: analysis.sentiment.positive, color: "#10b981" },
    { name: "중립", value: analysis.sentiment.neutral, color: "#6b7280" },
    { name: "부정", value: analysis.sentiment.negative, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          AI 빠른 분석
        </h3>
        <p className="text-sm text-muted-foreground">
          수집된 게시글의 제목과 스니펫을 기반으로 한 간단한 분석입니다. 
          상세한 분석을 원하시면 2차 분석을 진행해주세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 감성 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">감성 분석</CardTitle>
            <CardDescription>전체 게시글의 감성 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 주요 토픽 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">주요 토픽</CardTitle>
            <CardDescription>가장 많이 언급된 주제</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analysis.mainTopics}>
                <XAxis dataKey="topic" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 수집 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            게시글 수집 트렌드
          </CardTitle>
          <CardDescription>날짜별 게시글 수집 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
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
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
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
