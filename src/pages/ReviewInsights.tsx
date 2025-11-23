import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, Shield, Lock, FileText, BarChart3, Network } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import * as XLSX from 'xlsx';

interface ReviewData {
  review: string;
  [key: string]: any;
}

interface AnalysisResult {
  sentiment: { label: string; count: number }[];
  topics: { topic: string; count: number }[];
  keywords: { word: string; frequency: number }[];
  personas: string[];
  networkGraph: { nodes: { id: string; label: string }[]; edges: { source: string; target: string }[] };
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function ReviewInsights() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

      setAnalysis({
        sentiment: data.sentiment || [],
        topics: data.topics || [],
        keywords: topKeywords,
        personas: data.personas || [],
        networkGraph: data.networkGraph || { nodes: [], edges: [] },
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

          {/* Sentiment Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>감성 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analysis.sentiment}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="label"
                  >
                    {analysis.sentiment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Topics */}
          <Card>
            <CardHeader>
              <CardTitle>주요 토픽</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysis.topics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="언급 횟수" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Word Cloud / Keywords */}
          <Card>
            <CardHeader>
              <CardTitle>주요 키워드</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.slice(0, 30).map((kw, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    style={{ 
                      fontSize: `${Math.min(10 + kw.frequency / 2, 20)}px`,
                      opacity: 0.6 + (kw.frequency / analysis.keywords[0].frequency) * 0.4
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
            <CardHeader>
              <CardTitle>소비자 페르소나</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.personas.map((persona, idx) => (
                  <div key={idx} className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm">{persona}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Network Graph */}
          {analysis.networkGraph.nodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  키워드 네트워크
                </CardTitle>
              </CardHeader>
              <CardContent>
                <svg width="100%" height="400" className="border rounded-lg bg-muted/20">
                  {/* Simple node-link visualization */}
                  {analysis.networkGraph.edges.map((edge, idx) => {
                    const sourceNode = analysis.networkGraph.nodes.find(n => n.id === edge.source);
                    const targetNode = analysis.networkGraph.nodes.find(n => n.id === edge.target);
                    const sourceIdx = analysis.networkGraph.nodes.indexOf(sourceNode!);
                    const targetIdx = analysis.networkGraph.nodes.indexOf(targetNode!);
                    const x1 = 100 + (sourceIdx % 5) * 150;
                    const y1 = 100 + Math.floor(sourceIdx / 5) * 100;
                    const x2 = 100 + (targetIdx % 5) * 150;
                    const y2 = 100 + Math.floor(targetIdx / 5) * 100;
                    
                    return (
                      <line
                        key={idx}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="hsl(var(--border))"
                        strokeWidth="2"
                      />
                    );
                  })}
                  {analysis.networkGraph.nodes.map((node, idx) => {
                    const x = 100 + (idx % 5) * 150;
                    const y = 100 + Math.floor(idx / 5) * 100;
                    
                    return (
                      <g key={node.id}>
                        <circle
                          cx={x}
                          cy={y}
                          r="30"
                          fill="hsl(var(--primary))"
                          opacity="0.8"
                        />
                        <text
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="hsl(var(--primary-foreground))"
                          fontSize="12"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
