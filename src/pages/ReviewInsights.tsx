import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, Shield, Lock, FileText, BarChart3, Network, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import * as XLSX from 'xlsx';
import InteractiveNetworkGraph from "@/components/InteractiveNetworkGraph";

const parseMarkdown = (text: string) => {
  // Parse bold (**text** or __text__)
  let parsed = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-purple-900">$1</strong>');
  parsed = parsed.replace(/__(.+?)__/g, '<strong class="font-bold text-purple-900">$1</strong>');
  
  // Parse numbered lists (1. text)
  parsed = parsed.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="flex gap-2 my-2"><span class="font-semibold text-purple-700 min-w-[24px]">$1.</span><span class="flex-1">$2</span></div>');
  
  // Parse bullet points (- text or * text)
  parsed = parsed.replace(/^[-*]\s+(.+)$/gm, '<div class="flex gap-2 my-2"><span class="text-purple-500">•</span><span class="flex-1">$1</span></div>');
  
  // Parse line breaks
  parsed = parsed.replace(/\n\n/g, '<div class="h-4"></div>');
  parsed = parsed.replace(/\n/g, '<br/>');
  
  return parsed;
};

interface ReviewData {
  review: string;
  [key: string]: any;
}

interface AnalysisResult {
  sentiment: { label: string; count: number }[];
  topics: { topic: string; count: number }[];
  keywords: { word: string; frequency: number }[];
  personas: string[];
  networkGraph: { nodes: { id: string; label: string; x?: number; y?: number }[]; edges: { source: string; target: string }[] };
  ratingDistribution: { rating: number; count: number }[];
  dateDistribution: { date: string; count: number }[];
}

const chartColors = [
  'hsl(266, 89%, 68%)',
  'hsl(210, 100%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
];


export default function ReviewInsights() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [networkInterpretation, setNetworkInterpretation] = useState<string | null>(null);
  const [isInterpretingNetwork, setIsInterpretingNetwork] = useState(false);

  const sampleData = [
    { review: "이 제품 정말 좋아요. 배송도 빠르고 품질도 만족스럽습니다. 다음에도 재구매 의향 있어요.", rating: 5, date: "2025-01-15" },
    { review: "가격 대비 괜찮은 것 같아요. 다만 포장이 좀 아쉬웠어요. 그래도 제품 자체는 만족합니다.", rating: 4, date: "2025-01-14" },
    { review: "별로였습니다. 기대 이하였어요. 품질이 생각보다 안 좋네요.", rating: 2, date: "2025-01-13" },
    { review: "배송이 정말 빨랐어요! 포장도 꼼꼼하고 제품 상태도 완벽했습니다. 강력 추천해요.", rating: 5, date: "2025-01-12" },
    { review: "생각보다 크기가 작아서 조금 실망했지만 품질은 괜찮아요.", rating: 3, date: "2025-01-11" },
    { review: "가성비 최고! 이 가격에 이 정도 품질이면 정말 만족스럽습니다.", rating: 5, date: "2025-01-10" },
    { review: "디자인은 예쁜데 내구성이 좀 떨어지는 것 같아요. 조심해서 써야 할 듯.", rating: 3, date: "2025-01-09" },
    { review: "환불 요청했습니다. 제품에 결함이 있었어요.", rating: 1, date: "2025-01-08" },
    { review: "친구 선물로 샀는데 정말 좋아했어요. 포장도 고급스럽고 만족합니다.", rating: 5, date: "2025-01-07" },
    { review: "평범해요. 특별히 나쁘지도 좋지도 않은 제품이네요.", rating: 3, date: "2025-01-06" },
    { review: "색상이 사진과 달라서 당황했지만 그래도 쓸만해요.", rating: 3, date: "2025-01-05" },
    { review: "재구매 확정! 이미 세 번째 구매입니다. 품질 정말 좋아요.", rating: 5, date: "2025-01-04" },
    { review: "기능은 좋은데 가격이 좀 비싼 것 같아요. 할인할 때 사는 게 나을 듯.", rating: 4, date: "2025-01-03" },
    { review: "완전 실망했어요. 다신 안 삽니다. 품질도 별로고 CS도 불친절해요.", rating: 1, date: "2025-01-02" },
    { review: "무난하게 쓰기 좋아요. 가격도 적당하고 품질도 괜찮습니다.", rating: 4, date: "2025-01-01" },
  ];

  const downloadTemplate = () => {
    const template = [
      { review: "이 제품 정말 좋아요. 배송도 빠르고 품질도 만족스럽습니다.", rating: 5, date: "2025-01-15" },
      { review: "가격 대비 괜찮은 것 같아요. 다만 포장이 좀 아쉬웠어요.", rating: 4, date: "2025-01-14" },
      { review: "별로였습니다. 기대 이하였어요.", rating: 2, date: "2025-01-13" },
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "리뷰템플릿");
    XLSX.writeFile(wb, "리뷰_템플릿.xlsx");
    
    toast({
      title: "템플릿 다운로드 완료",
      description: "템플릿을 수정하여 업로드해주세요.",
    });
  };

  const loadSampleData = async () => {
    setReviews(sampleData);
    toast({
      title: "샘플 데이터 로드 완료",
      description: `${sampleData.length}개의 샘플 리뷰를 불러왔습니다.`,
    });
    
    // 자동으로 분석 시작
    setIsAnalyzing(true);
    
    try {
      const reviewTexts = sampleData.map(r => r.review || "").filter(Boolean);
      
      const wordFreq: Record<string, number> = {};
      reviewTexts.forEach(text => {
        const words = text.split(/[\s,.:;!?]+/).filter(w => w.length > 1);
        words.forEach(word => {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
      });
      
      const topKeywords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, frequency]) => ({ word, frequency }));

      // 평점 분포 계산
      const ratingCounts: Record<number, number> = {};
      sampleData.forEach(r => {
        if (r.rating) {
          ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
        }
      });
      const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratingCounts[rating] || 0
      }));

      // 날짜별 분포 계산
      const dateCounts: Record<string, number> = {};
      sampleData.forEach(r => {
        if (r.date) {
          dateCounts[r.date] = (dateCounts[r.date] || 0) + 1;
        }
      });
      const dateDistribution = Object.entries(dateCounts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));

      const { data, error } = await supabase.functions.invoke('analyze-review-insights', {
        body: { reviews: reviewTexts.slice(0, 100) }
      });

      if (error) throw error;

      setAnalysis({
        sentiment: data.sentiment || [],
        topics: data.topics || [],
        keywords: topKeywords,
        personas: data.personas || [],
        networkGraph: data.networkGraph || { nodes: [], edges: [] },
        ratingDistribution,
        dateDistribution,
      });

      toast({
        title: "샘플 데이터 분석 완료",
        description: "리뷰 인사이트가 생성되었습니다.",
      });
    } catch (error) {
      console.error("Sample analysis error:", error);
      toast({
        title: "분석 실패",
        description: "분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as ReviewData[];
        
        setReviews(json);
        toast({
          title: "파일 업로드 완료",
          description: `${json.length}개의 리뷰를 불러왔습니다.`,
        });
      };
      reader.readAsBinaryString(uploadedFile);
    } catch (error) {
      toast({
        title: "파일 읽기 실패",
        description: "파일 형식을 확인해주세요.",
        variant: "destructive",
      });
    }
  };

  const analyzeReviews = async () => {
    if (reviews.length === 0) {
      toast({
        title: "리뷰 데이터 없음",
        description: "먼저 리뷰 파일을 업로드해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // 클라이언트 사이드 기본 통계
      const reviewTexts = reviews.map(r => r.review || "").filter(Boolean);
      
      // 키워드 빈도 계산 (간단한 한글 토큰화)
      const wordFreq: Record<string, number> = {};
      reviewTexts.forEach(text => {
        const words = text.split(/[\s,.:;!?]+/).filter(w => w.length > 1);
        words.forEach(word => {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
      });
      
      const topKeywords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, frequency]) => ({ word, frequency }));

      // Lovable AI로 고급 분석 (일회성, 서버 저장 없음)
      const { data, error } = await supabase.functions.invoke('analyze-review-insights', {
        body: { reviews: reviewTexts.slice(0, 100) } // 최대 100개로 제한
      });

      if (error) throw error;

      // 평점 분포 계산
      const ratingCounts: Record<number, number> = {};
      reviews.forEach(r => {
        if (r.rating) {
          ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
        }
      });
      const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratingCounts[rating] || 0
      }));

      // 날짜별 분포 계산
      const dateCounts: Record<string, number> = {};
      reviews.forEach(r => {
        if (r.date) {
          dateCounts[r.date] = (dateCounts[r.date] || 0) + 1;
        }
      });
      const dateDistribution = Object.entries(dateCounts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));

      setAnalysis({
        sentiment: data.sentiment || [],
        topics: data.topics || [],
        keywords: topKeywords,
        personas: data.personas || [],
        networkGraph: data.networkGraph || { nodes: [], edges: [] },
        ratingDistribution,
        dateDistribution,
      });

      toast({
        title: "분석 완료",
        description: "리뷰 인사이트가 생성되었습니다.",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "분석 실패",
        description: "분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const interpretNetwork = async () => {
    if (!analysis || analysis.networkGraph.nodes.length === 0) return;
    
    setIsInterpretingNetwork(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-review-insights', {
        body: { 
          reviews: [],
          networkGraph: analysis.networkGraph,
          interpretNetwork: true
        }
      });

      if (error) throw error;

      setNetworkInterpretation(data.networkInterpretation || "네트워크 해석을 생성할 수 없습니다.");
      
      toast({
        title: "네트워크 해석 완료",
        description: "키워드 관계 분석이 완료되었습니다.",
      });
    } catch (error) {
      console.error("Network interpretation error:", error);
      toast({
        title: "해석 실패",
        description: "네트워크 해석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsInterpretingNetwork(false);
    }
  };

  const downloadResults = () => {
    if (!analysis) return;
    
    const results = {
      sentiment: analysis.sentiment,
      topics: analysis.topics,
      keywords: analysis.keywords,
      personas: analysis.personas,
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '분석결과.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "다운로드 완료",
      description: "분석 결과가 저장되었습니다.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">리뷰 인사이트 분석기</h1>
        <p className="text-muted-foreground">
          리뷰 데이터를 업로드하여 AI 기반 인사이트를 확인하세요
        </p>
      </div>

      {/* Security Emphasis Section */}
      <Alert className="border-primary/50 bg-primary/5">
        <Shield className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-4">
          <div className="flex-1">
            <strong className="text-primary">완벽한 데이터 보안</strong>
            <p className="text-sm mt-1">
              모든 분석은 브라우저에서만 처리됩니다. 귀하의 리뷰 데이터는 절대 서버에 저장되지 않습니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-primary text-primary">
              <Lock className="w-3 h-3 mr-1" />
              서버 전송 없음
            </Badge>
            <Badge variant="outline" className="border-primary text-primary">
              <Shield className="w-3 h-3 mr-1" />
              100% 클라이언트 처리
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* File Upload Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              파일 업로드
            </CardTitle>
            <CardDescription>
              Excel 또는 CSV 파일을 업로드하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  클릭하여 파일 선택
                </p>
                {file && (
                  <Badge variant="secondary" className="mt-2">
                    {file.name}
                  </Badge>
                )}
              </label>
            </div>
            
            {reviews.length > 0 && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium">
                  📊 {reviews.length}개의 리뷰 로드됨
                </p>
              </div>
            )}

            <Button 
              onClick={analyzeReviews} 
              disabled={reviews.length === 0 || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? "분석 중..." : "분석 시작"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              템플릿 다운로드
            </CardTitle>
            <CardDescription>
              샘플 형식을 확인하고 데이터를 준비하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">템플릿 구조:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>review</strong> (필수): 리뷰 텍스트</li>
                <li><strong>rating</strong> (선택): 평점</li>
                <li><strong>date</strong> (선택): 작성일</li>
              </ul>
            </div>
            <Button onClick={downloadTemplate} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              템플릿 다운로드
            </Button>
            <Button onClick={loadSampleData} variant="secondary" className="w-full">
              <BarChart3 className="w-4 h-4 mr-2" />
              샘플 데이터로 테스트
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">분석 결과</h2>
            <Button onClick={downloadResults} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              결과 다운로드
            </Button>
          </div>

          {/* 2x2 Grid for main charts */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Sentiment Analysis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">감성 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={analysis.sentiment}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={(entry) => `${entry.label}: ${entry.count}`}
                      >
                        {analysis.sentiment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(240 15% 92%)', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Rating Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">평점 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analysis.ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 15% 92%)" opacity={0.3} />
                    <XAxis dataKey="rating" tick={{ fontSize: 12, fill: 'hsl(240 8% 50%)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(240 8% 50%)' }} />
                    <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(240 15% 92%)', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill={chartColors[1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Topics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">주요 토픽</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analysis.topics.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 15% 92%)" opacity={0.3} />
                    <XAxis dataKey="topic" tick={{ fontSize: 11, fill: 'hsl(240 8% 50%)' }} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(240 8% 50%)' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(240 15% 92%)', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill={chartColors[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Date Trend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">시간별 트렌드</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={analysis.dateDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 15% 92%)" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(240 8% 50%)' }} angle={-45} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(240 8% 50%)' }} />
                    <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(240 15% 92%)', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="count" stroke={chartColors[2]} strokeWidth={2} dot={{ r: 4, fill: chartColors[2] }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Keyword Cloud - Full Width */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">주요 키워드</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 min-h-[120px]">
                {analysis.keywords.slice(0, 30).map((kw, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="transition-all hover:scale-110 cursor-default"
                    style={{ 
                      fontSize: `${Math.min(11 + kw.frequency / 2, 18)}px`,
                      opacity: 0.6 + (kw.frequency / analysis.keywords[0].frequency) * 0.4,
                      padding: "4px 10px"
                    }}
                  >
                    {kw.word} ({kw.frequency})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Consumer Personas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">소비자 페르소나</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {analysis.personas.map((persona, idx) => (
                  <div key={idx} className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-sm leading-relaxed">{persona}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interactive Network Graph */}
          {analysis.networkGraph.nodes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Network className="w-4 h-4" />
                      키워드 네트워크 (드래그 가능)
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      노드를 드래그하여 이동할 수 있습니다. 마우스를 올리면 강조됩니다.
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={interpretNetwork} 
                    disabled={isInterpretingNetwork}
                    size="sm"
                    variant="outline"
                  >
                    {isInterpretingNetwork ? "분석 중..." : "🤖 AI 해석"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <InteractiveNetworkGraph 
                  nodes={analysis.networkGraph.nodes}
                  edges={analysis.networkGraph.edges}
                />
                {networkInterpretation && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">AI 네트워크 해석</h4>
                    </div>
                    <div 
                      className="text-sm leading-relaxed text-gray-800"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(networkInterpretation) }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
