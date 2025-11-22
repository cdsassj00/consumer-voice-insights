import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Sparkles, CheckCircle2, Eye } from "lucide-react";
import { ArticleModal } from "./ArticleModal";

interface SearchResult {
  id: string;
  keyword: string;
  url: string;
  title: string;
  snippet: string;
  source_domain: string;
  status: 'pending' | 'crawling' | 'analyzed' | 'failed';
}

interface SearchResultsListProps {
  results: SearchResult[];
  onAnalyze: (selectedIds: string[]) => void;
  isProcessing: boolean;
}

export const SearchResultsList = ({ results, onAnalyze, isProcessing }: SearchResultsListProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  const openModal = (url: string, title: string) => {
    setModalUrl(url);
    setModalTitle(title);
    setModalOpen(true);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(r => r.id)));
    }
  };

  const handleAnalyze = () => {
    if (selectedIds.size > 0) {
      onAnalyze(Array.from(selectedIds));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'analyzed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />분석 완료</Badge>;
      case 'crawling':
        return <Badge variant="secondary">분석 중</Badge>;
      case 'failed':
        return <Badge variant="destructive">실패</Badge>;
      default:
        return <Badge variant="outline">대기 중</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-4">
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                1차 필터링 결과
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                AI가 광고, 프로모션, 뉴스를 제외하고 <span className="font-semibold text-primary">실제 소비자 의견만</span> 선별했습니다
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedIds.size === results.length && results.length > 0}
                onCheckedChange={selectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                전체 선택 ({selectedIds.size}/{results.length})
              </label>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={selectedIds.size === 0 || isProcessing}
              size="lg"
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isProcessing ? '분석 진행 중...' : `선택한 ${selectedIds.size}개 상세 분석하기`}
            </Button>
          </div>

          <div className="space-y-3">
            {results.map((result) => (
              <Card
                key={result.id}
                className={`transition-all hover:shadow-md ${
                  selectedIds.has(result.id) ? 'border-primary border-2 bg-primary/5' : 'border-border'
                }`}
              >
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedIds.has(result.id)}
                        onCheckedChange={() => toggleSelection(result.id)}
                        disabled={result.status === 'analyzed'}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground leading-tight flex-1">
                            {result.title}
                          </h3>
                          {getStatusBadge(result.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.snippet}
                        </p>
                        
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <Badge variant="outline" className="font-medium">
                            키워드: {result.keyword}
                          </Badge>
                          <Badge variant="secondary" className="font-normal">
                            {result.source_domain}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-primary hover:underline"
                            onClick={() => openModal(result.url, result.title)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            원문 보기
                          </Button>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            새 탭에서 열기 <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              검색 결과가 없습니다
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="text-sm space-y-2">
            <p className="font-semibold text-foreground">💡 2차 상세 분석이란?</p>
            <ul className="text-muted-foreground space-y-1 ml-4">
              <li>• 게시글 전문을 수집하여 심층 분석</li>
              <li>• 감성 분석 (긍정/부정/중립)</li>
              <li>• 주요 토픽, 장단점, 추천도 추출</li>
              <li>• 시각화된 인사이트 리포트 제공</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>

    <ArticleModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      url={modalUrl}
      title={modalTitle}
    />
  </>
  );
};
