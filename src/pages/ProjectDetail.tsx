import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Settings, 
  Search, 
  Star, 
  Plus,
  Trash2,
  BarChart,
  Clock,
  TrendingUp,
  Loader2,
  HelpCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProjectModal } from "@/components/ProjectModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FirstStageAnalysis } from "@/components/FirstStageAnalysis";
import type { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

type Project = Tables<"projects">;
type Keyword = Tables<"keywords">;
type SearchResult = {
  id: string;
  title: string;
  url: string;
  snippet: string | null;
  keyword: string;
  article_published_at: string | null;
  status: string | null;
};

// 복잡한 검색 쿼리를 읽기 쉬운 형태로 변환하는 헬퍼 함수
const formatKeywordDisplay = (keyword: string, displayName: string | null): string => {
  if (displayName) return displayName;
  
  // 가이드 검색 형식인지 확인: (A AND B AND C) OR (A AND B AND D) 형태
  if (keyword.includes(" OR ") && keyword.includes(" AND ") && keyword.includes("(")) {
    try {
      // 각 OR 절을 분리
      const orParts = keyword.split(" OR ");
      
      // 첫 번째 절에서 공통 부분(회사, 제품) 추출
      const firstPart = orParts[0].replace(/^\(|\)$/g, "").split(" AND ");
      if (firstPart.length >= 2) {
        const company = firstPart[0];
        const product = firstPart[1];
        
        // 각 OR 절에서 마지막 키워드(정보 타입) 추출
        const infoTypes = orParts.map(part => {
          const parts = part.replace(/^\(|\)$/g, "").split(" AND ");
          return parts[parts.length - 1];
        });
        
        return `${company} ${product} (${infoTypes.join("/")})`;
      }
    } catch (e) {
      console.error("Failed to format keyword:", e);
    }
  }
  
  // 변환 실패 시 원본 반환 (너무 길면 줄임)
  return keyword.length > 50 ? keyword.substring(0, 47) + "..." : keyword;
};

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [availableKeywords, setAvailableKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [companyBrandInput, setCompanyBrandInput] = useState("");
  const [productServiceInput, setProductServiceInput] = useState("");
  const [selectedKeywordTypes, setSelectedKeywordTypes] = useState<string[]>([]);
  const [isGuidedSearching, setIsGuidedSearching] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState<Step[]>([]);
  
  // Confirm dialog states
  const [removeKeywordDialogOpen, setRemoveKeywordDialogOpen] = useState(false);
  const [keywordToRemove, setKeywordToRemove] = useState<string | null>(null);
  const [deleteResultDialogOpen, setDeleteResultDialogOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<string | null>(null);
  
  const keywordTypes = [
    { id: "review", label: "후기" },
    { id: "evaluation", label: "평가" },
    { id: "experience", label: "체험" },
    { id: "promotion", label: "프로모션" },
    { id: "price", label: "가격" },
    { id: "comparison", label: "비교" },
    { id: "quality", label: "품질" },
    { id: "effectiveness", label: "효과" },
  ];

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  // Define tour steps
  useEffect(() => {
    const steps: Step[] = [
      {
        target: '[data-tour="guided-search"]',
        content: '3단계 질문에 답하면 자동으로 최적의 검색어를 생성하고 즉시 검색을 실행합니다. 검색된 키워드는 프로젝트에 자동으로 저장됩니다.',
        disableBeacon: true,
        placement: 'bottom',
      },
      {
        target: '[data-tour="keyword-add"]',
        content: '다른 프로젝트에서 사용한 키워드를 가져와 재사용할 수 있습니다. 검색은 실행되지 않고 프로젝트에만 할당됩니다.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="project-search"]',
        content: '할당된 모든 키워드로 한 번에 검색을 실행합니다. 효율적인 대량 데이터 수집이 가능합니다.',
        placement: 'top',
      },
      {
        target: '[data-tour="keyword-list"]',
        content: '프로젝트에 저장된 키워드들입니다. 개별 검색, 삭제, 즐겨찾기 설정이 가능합니다.',
        placement: 'top',
      },
      {
        target: '[data-tour="results-list"]',
        content: '수집된 게시글을 확인할 수 있습니다. 각 게시글을 클릭하면 원본 페이지로 이동합니다.',
        placement: 'top',
      },
    ];
    setTourSteps(steps);
  }, []);

  // Auto-run tour for first-time visitors with empty projects
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('project-tour-completed');
    
    if (!hasSeenTour && project && keywords.length === 0) {
      setTimeout(() => {
        setRunTour(true);
      }, 1000);
    }
  }, [project, keywords]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      localStorage.setItem('project-tour-completed', 'true');
    }
  };

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 모든 데이터를 병렬로 가져오기 (성능 최적화)
      const [
        { data: projectData, error: projectError },
        { data: keywordsData, error: keywordsError },
        { data: availableData, error: availableError },
        { data: resultsData, error: resultsError }
      ] = await Promise.all([
        // Fetch project
        supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .eq("user_id", user.id)
          .maybeSingle(),
        
        // Fetch keywords assigned to this project
        supabase
          .from("keywords")
          .select("*")
          .eq("project_id", projectId)
          .eq("is_active", true)
          .order("keyword"),
        
        // Fetch available keywords (not assigned to any project)
        supabase
          .from("keywords")
          .select("*")
          .eq("user_id", user.id)
          .is("project_id", null)
          .eq("is_active", true)
          .order("keyword"),
        
        // Check if there are search results for this project
        supabase
          .from("search_results")
          .select("*")
          .eq("project_id", projectId)
          .limit(1)
      ]);

      if (projectError) throw projectError;
      if (!projectData) {
        toast({
          title: "프로젝트를 찾을 수 없습니다",
          variant: "destructive",
        });
        navigate("/projects");
        return;
      }

      setProject(projectData);
      
      if (keywordsError) throw keywordsError;
      setKeywords(keywordsData || []);
      
      if (availableError) throw availableError;
      setAvailableKeywords(availableData || []);

      // 분석 데이터는 백그라운드에서 로드 (UI 블로킹 방지)
      if (!resultsError && resultsData && resultsData.length > 0) {
        setShowAnalysis(true);
        // 분석 로딩을 비동기로 실행하여 페이지 렌더링 차단 방지
        loadProjectAnalysis();
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast({
        title: "데이터 조회 실패",
        description: "프로젝트 정보를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectAnalysis = async () => {
    try {
      setIsLoadingAnalysis(true);
      
      // 사용자 정보와 검색 결과를 병렬로 가져오기
      const [
        { data: { user } },
        { data: results, error: resultsError }
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("search_results")
          .select("id, title, url, snippet, keyword, article_published_at, status")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
      ]);

      if (!user) return;
      if (resultsError) throw resultsError;

      setSearchResults(results || []);

      if (!results || results.length === 0) {
        setShowAnalysis(false);
        return;
      }

      // Try to get cached analysis for this project
      const { data: cachedAnalysis } = await supabase
        .from("first_stage_analysis_cache")
        .select("*")
        .eq("user_id", user.id)
        .eq("keyword", `project:${projectId}`)
        .eq("search_period", "m3")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cachedAnalysis) {
        setAnalysisData(cachedAnalysis.analysis_data);
        setTrendData(Array.isArray(cachedAnalysis.trend_data) ? cachedAnalysis.trend_data : []);
      } else {
        // Generate new analysis
        await generateProjectAnalysis(results);
      }
    } catch (error) {
      console.error("Error loading project analysis:", error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const generateProjectAnalysis = async (results: any[]) => {
    try {
      const response = await supabase.functions.invoke("analyze-first-stage", {
        body: {
          searchResults: results,
          keyword: `project:${projectId}`,
          searchPeriod: "m3",
        },
      });

      if (response.error) throw response.error;

      if (response.data) {
        setAnalysisData(response.data.analysis);
        setTrendData(response.data.trendData);
      }
    } catch (error) {
      console.error("Error generating project analysis:", error);
      toast({
        title: "분석 생성 실패",
        description: "프로젝트 분석을 생성하는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleAddKeyword = async (keywordId: string) => {
    try {
      const { error } = await supabase
        .from("keywords")
        .update({ project_id: projectId })
        .eq("id", keywordId);

      if (error) throw error;

      toast({
        title: "키워드 추가 완료",
        description: "프로젝트에 키워드가 추가되었습니다.",
      });
      fetchProjectData();
    } catch (error) {
      console.error("Error adding keyword:", error);
      toast({
        title: "키워드 추가 실패",
        variant: "destructive",
      });
    }
  };

  const handleRemoveKeyword = (keywordId: string) => {
    setKeywordToRemove(keywordId);
    setRemoveKeywordDialogOpen(true);
  };

  const confirmRemoveKeyword = async () => {
    if (!keywordToRemove) return;

    try {
      const { error } = await supabase
        .from("keywords")
        .update({ project_id: null })
        .eq("id", keywordToRemove);

      if (error) throw error;

      toast({
        title: "키워드 제거 완료",
        description: "프로젝트에서 키워드가 제거되었습니다.",
      });
      fetchProjectData();
    } catch (error) {
      console.error("Error removing keyword:", error);
      toast({
        title: "키워드 제거 실패",
        variant: "destructive",
      });
    } finally {
      setRemoveKeywordDialogOpen(false);
      setKeywordToRemove(null);
    }
  };

  const handleDeleteResult = (resultId: string) => {
    setResultToDelete(resultId);
    setDeleteResultDialogOpen(true);
  };

  const confirmDeleteResult = async () => {
    if (!resultToDelete) return;
    
    try {
      const { error } = await supabase
        .from('search_results')
        .delete()
        .eq('id', resultToDelete);
      
      if (error) throw error;
      
      // 로컬 state에서 제거
      setSearchResults(prev => prev.filter(r => r.id !== resultToDelete));
      
      toast({
        title: "삭제 완료",
        description: "게시글이 삭제되었습니다.",
      });
      
      // 분석 데이터 새로고침 (결과 수 변경 반영)
      if (showAnalysis) {
        await loadProjectAnalysis();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "삭제 실패",
        description: "게시글 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDeleteResultDialogOpen(false);
      setResultToDelete(null);
    }
  };

  const handleProjectSearch = async () => {
    if (keywords.length === 0) {
      toast({
        title: "키워드가 없습니다",
        description: "프로젝트에 키워드를 먼저 추가해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      toast({
        title: "프로젝트 검색 시작",
        description: `${keywords.length}개 키워드에 대한 검색을 시작합니다...`,
      });

      // 각 키워드에 대해 순차적으로 검색 실행
      let totalResults = 0;
      for (const keyword of keywords) {
        try {
          const response = await supabase.functions.invoke("search-and-filter", {
            body: {
              keyword: keyword.keyword,
              searchPeriod: "m3", // 기본 3개월
              projectId: projectId,
            },
          });

          if (response.error) {
            console.error(`Error searching keyword ${keyword.keyword}:`, response.error);
            continue;
          }

          if (response.data?.savedToDatabase) {
            totalResults += response.data.savedToDatabase;
          }

          // 키워드 검색 횟수 업데이트
          await supabase
            .from("keywords")
            .update({
              search_count: (keyword.search_count || 0) + 1,
              last_searched_at: new Date().toISOString(),
            })
            .eq("id", keyword.id);
        } catch (error) {
          console.error(`Error processing keyword ${keyword.keyword}:`, error);
        }
      }

      toast({
        title: "프로젝트 검색 완료",
        description: `총 ${totalResults}개의 결과가 수집되었습니다.`,
      });

      // 데이터 새로고침
      fetchProjectData();
      setShowAnalysis(true);
    } catch (error) {
      console.error("Error in project search:", error);
      toast({
        title: "검색 실패",
        description: "프로젝트 검색 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleKeywordType = (typeId: string) => {
    setSelectedKeywordTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleGuidedSearch = async () => {
    if (!companyBrandInput.trim()) {
      toast({
        title: "회사/브랜드명 입력 필요",
        description: "회사 또는 브랜드명을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!productServiceInput.trim()) {
      toast({
        title: "제품/서비스명 입력 필요",
        description: "제품 또는 서비스명을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (selectedKeywordTypes.length === 0) {
      toast({
        title: "정보 타입 선택 필요",
        description: "최소 1개 이상의 정보 타입을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGuidedSearching(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 선택된 키워드 타입의 라벨 추출
      const selectedLabels = keywordTypes
        .filter(type => selectedKeywordTypes.includes(type.id))
        .map(type => type.label);

      // (1단계 AND 2단계 AND 3단계_첫번째) OR (1단계 AND 2단계 AND 3단계_두번째) 형식
      const searchQueries = selectedLabels.map(
        label => `(${companyBrandInput} AND ${productServiceInput} AND ${label})`
      );
      const searchQuery = searchQueries.join(" OR ");
      
      // 사람이 읽기 쉬운 표시명 생성
      const displayName = `${companyBrandInput} ${productServiceInput} (${selectedLabels.join("/")})`;
      
      toast({
        title: "검색 시작",
        description: `검색 쿼리: ${searchQuery}`,
      });

      const response = await supabase.functions.invoke("search-and-filter", {
        body: {
          keyword: searchQuery,
          searchPeriod: "m3",
          projectId: projectId,
        },
      });

      if (response.error) throw response.error;

      const totalResults = response.data?.savedToDatabase || 0;

      // 검색에 사용된 키워드를 프로젝트에 자동 추가
      const existingKeyword = keywords.find(k => k.keyword === searchQuery);
      if (!existingKeyword) {
        await supabase
          .from("keywords")
          .insert({
            keyword: searchQuery,
            display_name: displayName,
            user_id: user.id,
            project_id: projectId,
            source: "guided_search",
            category: null,
            search_count: 1,
            last_searched_at: new Date().toISOString(),
          });
      } else {
        await supabase
          .from("keywords")
          .update({
            search_count: (existingKeyword.search_count || 0) + 1,
            last_searched_at: new Date().toISOString(),
          })
          .eq("id", existingKeyword.id);
      }

      toast({
        title: "검색 완료",
        description: `총 ${totalResults}개의 결과가 수집되었습니다.`,
      });

      setCompanyBrandInput("");
      setProductServiceInput("");
      setSelectedKeywordTypes([]);
      fetchProjectData();
      setShowAnalysis(true);
    } catch (error) {
      console.error("Guided search error:", error);
      toast({
        title: "검색 실패",
        description: error instanceof Error ? error.message : "검색 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGuidedSearching(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchProjectData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">프로젝트를 불러오는 중...</p>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/projects")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="outline">{project.project_type || "기타"}</Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-2">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setRunTour(true)}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            사용 가이드
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsModalOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            프로젝트 설정
          </Button>
        </div>
      </div>

      {/* Guided Search - 3 Step Process */}
      <Card data-tour="guided-search" className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            가이드 검색
          </CardTitle>
          <CardDescription>
            3단계 가이드를 통해 체계적인 검색을 수행하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Company/Brand Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              1단계: 회사 또는 브랜드명
            </label>
            <Input
              placeholder="예: 올리브영"
              value={companyBrandInput}
              onChange={(e) => setCompanyBrandInput(e.target.value)}
              disabled={isGuidedSearching}
            />
          </div>

          {/* Step 2: Product/Service Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              2단계: 제품 또는 서비스명
            </label>
            <Input
              placeholder="예: 브링그린"
              value={productServiceInput}
              onChange={(e) => setProductServiceInput(e.target.value)}
              disabled={isGuidedSearching}
            />
          </div>

          {/* Step 3: Keyword Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              3단계: 정보 타입 선택 (복수 선택 가능)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {keywordTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedKeywordTypes.includes(type.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleKeywordType(type.id)}
                  disabled={isGuidedSearching}
                  className="justify-start"
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleGuidedSearch} 
              disabled={isGuidedSearching || !companyBrandInput.trim() || !productServiceInput.trim() || selectedKeywordTypes.length === 0}
              className="flex-1"
            >
              {isGuidedSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  검색 중...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  검색 실행
                </>
              )}
            </Button>
            {(companyBrandInput || productServiceInput || selectedKeywordTypes.length > 0) && !isGuidedSearching && (
              <Button
                variant="outline"
                onClick={() => {
                  setCompanyBrandInput("");
                  setProductServiceInput("");
                  setSelectedKeywordTypes([]);
                }}
              >
                초기화
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>* 검색 쿼리 구조: (회사 AND 제품 AND 정보타입1) OR (회사 AND 제품 AND 정보타입2) ...</p>
            <p className="text-primary">
              예시: 올리브영 + 브링그린 + [후기, 평가] → (올리브영 AND 브링그린 AND 후기) OR (올리브영 AND 브링그린 AND 평가)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Keywords Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assigned Keywords */}
        <Card data-tour="keyword-list">
          <CardHeader>
            <CardTitle>할당된 키워드 ({keywords.length})</CardTitle>
            <CardDescription>
              이 프로젝트에 할당된 키워드 목록입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Project-wide Search Button */}
            <div className="mb-4 pb-4 border-b">
              <Button 
                data-tour="project-search"
                onClick={handleProjectSearch} 
                className="w-full"
                size="lg"
                disabled={keywords.length === 0}
              >
                <Search className="mr-2 h-4 w-4" />
                프로젝트 전체 검색
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                할당된 모든 키워드로 검색을 실행합니다
              </p>
            </div>
            
            {keywords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>할당된 키워드가 없습니다</p>
                <p className="text-sm mt-1">오른쪽에서 키워드를 추가해보세요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {keywords.map((keyword) => (
                  <div
                    key={keyword.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{formatKeywordDisplay(keyword.keyword, keyword.display_name)}</span>
                        {keyword.source === "guided_search" && (
                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                            가이드 검색
                          </Badge>
                        )}
                        {keyword.category && (
                          <Badge variant="secondary" className="text-xs">
                            {keyword.category}
                          </Badge>
                        )}
                        {keyword.is_favorite && (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      {keyword.search_count > 0 && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BarChart className="w-3 h-3" />
                            검색 {keyword.search_count}회
                          </span>
                          {keyword.last_searched_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(keyword.last_searched_at), {
                                addSuffix: true,
                                locale: ko,
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveKeyword(keyword.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Keywords */}
        <Card data-tour="keyword-add">
          <CardHeader>
            <CardTitle>키워드 추가</CardTitle>
            <CardDescription>
              프로젝트에 추가할 키워드를 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableKeywords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>추가 가능한 키워드가 없습니다</p>
                <p className="text-sm mt-1">
                  키워드 관리에서 새 키워드를 만들어보세요
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Select onValueChange={handleAddKeyword}>
                  <SelectTrigger>
                    <SelectValue placeholder="키워드 선택..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableKeywords.map((keyword) => (
                      <SelectItem key={keyword.id} value={keyword.id}>
                        {formatKeywordDisplay(keyword.keyword, keyword.display_name)}
                        {keyword.category && ` (${keyword.category})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                  {availableKeywords.slice(0, 5).map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleAddKeyword(keyword.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatKeywordDisplay(keyword.keyword, keyword.display_name)}</span>
                        {keyword.category && (
                          <Badge variant="secondary" className="text-xs">
                            {keyword.category}
                          </Badge>
                        )}
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                  {availableKeywords.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      {availableKeywords.length - 5}개 키워드 더 있음
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Stats */}
      <Card>
        <CardHeader>
          <CardTitle>프로젝트 통계</CardTitle>
          <CardDescription>
            이 프로젝트의 주요 지표입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">할당된 키워드</p>
              <p className="text-3xl font-bold">{keywords.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">총 검색 횟수</p>
              <p className="text-3xl font-bold">
                {keywords.reduce((sum, k) => sum + (k.search_count || 0), 0)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">마지막 업데이트</p>
              <p className="text-lg font-semibold">
                {formatDistanceToNow(new Date(project.updated_at), {
                  addSuffix: true,
                  locale: ko,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collected Posts List for this Project */}
      <Card data-tour="results-list">
        <CardHeader>
          <CardTitle>수집된 게시글 ({searchResults.length})</CardTitle>
          <CardDescription>
            이 프로젝트 검색으로 1차 DB에 저장된 게시글입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searchResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>아직 수집된 게시글이 없습니다.</p>
              <p className="text-sm mt-1">상단의 "프로젝트 전체 검색" 또는 가이드 검색을 실행해보세요.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              {searchResults.map((result) => (
                <a
                  key={result.id}
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border bg-card hover:bg-accent/60 transition-colors p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <h4 className="font-medium line-clamp-2 leading-snug">
                        {result.title}
                      </h4>
                      {result.snippet && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.snippet}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {result.article_published_at && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(result.article_published_at).toLocaleDateString("ko-KR")}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteResult(result.id);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integrated Analysis Dashboard */}
      {showAnalysis && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle>프로젝트 통합 분석</CardTitle>
            </div>
            <CardDescription>
              프로젝트의 모든 키워드에 대한 통합 분석 결과입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAnalysis ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : analysisData ? (
              <FirstStageAnalysis 
                analysis={analysisData}
                trendData={trendData}
                searchResults={searchResults}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>분석 데이터가 없습니다</p>
                <p className="text-sm mt-1">프로젝트 전체 검색을 실행해보세요</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Onboarding Tour */}
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        locale={{
          back: '이전',
          close: '닫기',
          last: '완료',
          next: '다음',
          skip: '건너뛰기',
        }}
        styles={{
          options: {
            arrowColor: '#fff',
            backgroundColor: '#fff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            primaryColor: 'hsl(var(--primary))',
            textColor: 'hsl(var(--foreground))',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 8,
            padding: 24,
            fontSize: 16,
            lineHeight: 1.6,
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          },
          tooltipTitle: {
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 8,
          },
          tooltipContent: {
            padding: '8px 0',
          },
          buttonNext: {
            backgroundColor: 'hsl(var(--primary))',
            borderRadius: 6,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 500,
            color: 'hsl(var(--primary-foreground))',
            transition: 'all 0.2s ease',
          },
          buttonBack: {
            color: 'hsl(var(--muted-foreground))',
            marginRight: 12,
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 6,
            transition: 'all 0.2s ease',
          },
          buttonSkip: {
            color: 'hsl(var(--muted-foreground))',
            fontSize: 14,
            padding: '10px 16px',
          },
          spotlight: {
            borderRadius: 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 0, 0, 0.3)',
          },
        }}
      />

      {/* Project Modal */}
      <ProjectModal
        open={isModalOpen}
        onClose={handleModalClose}
        project={project}
      />

      {/* Remove Keyword Confirmation Dialog */}
      <ConfirmDialog
        open={removeKeywordDialogOpen}
        onOpenChange={setRemoveKeywordDialogOpen}
        title="키워드 제거"
        description="이 키워드를 프로젝트에서 제거하시겠습니까? 키워드는 삭제되지 않고 프로젝트 할당만 해제됩니다."
        confirmText="제거"
        cancelText="취소"
        onConfirm={confirmRemoveKeyword}
        variant="destructive"
      />

      {/* Delete Result Confirmation Dialog */}
      <ConfirmDialog
        open={deleteResultDialogOpen}
        onOpenChange={setDeleteResultDialogOpen}
        title="게시글 삭제"
        description="이 게시글을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        onConfirm={confirmDeleteResult}
        variant="destructive"
      />
    </div>
  );
}
