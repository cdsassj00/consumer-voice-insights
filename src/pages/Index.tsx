import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, FolderKanban, Clock, TrendingUp, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

type Project = {
  id: string;
  name: string;
  description: string | null;
  project_type: string | null;
  updated_at: string;
  keywordCount?: number;
  searchCount?: number;
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quickSearchKeyword, setQuickSearchKeyword] = useState("");
  const [isQuickSearching, setIsQuickSearching] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(6);

      if (projectsError) throw projectsError;

      // Fetch keyword counts for each project
      const projectsWithCounts = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { count: keywordCount } = await supabase
            .from("keywords")
            .select("*", { count: "exact", head: true })
            .eq("project_id", project.id);

          const { data: keywords } = await supabase
            .from("keywords")
            .select("search_count")
            .eq("project_id", project.id);

          const totalSearchCount = keywords?.reduce((sum, k) => sum + (k.search_count || 0), 0) || 0;

          return {
            ...project,
            keywordCount: keywordCount || 0,
            searchCount: totalSearchCount,
          };
        })
      );

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "프로젝트 로드 실패",
        description: "프로젝트 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleQuickSearch = async () => {
    if (!quickSearchKeyword.trim()) {
      toast({
        title: "키워드 입력 필요",
        description: "검색할 키워드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsQuickSearching(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("인증되지 않은 사용자입니다.");

      toast({
        title: "빠른 검색 시작",
        description: `"${quickSearchKeyword}" 검색 중...`,
      });

      const { data, error } = await supabase.functions.invoke("search-and-filter", {
        body: {
          keyword: quickSearchKeyword,
          searchPeriod: "m3",
        },
      });

      if (error) throw error;

      toast({
        title: "검색 완료",
        description: `${data.validResults?.length || 0}개의 결과를 찾았습니다.`,
      });
    } catch (error) {
      console.error("Quick search error:", error);
      toast({
        title: "검색 실패",
        description: error instanceof Error ? error.message : "검색 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsQuickSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">대시보드</h1>
          <p className="text-muted-foreground">프로젝트 현황과 빠른 검색을 한눈에</p>
        </div>

        {/* Quick Search Card */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              맛보기 검색
            </CardTitle>
            <CardDescription>
              프로젝트 할당 없이 빠르게 키워드를 검색해보세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="검색할 키워드를 입력하세요"
                value={quickSearchKeyword}
                onChange={(e) => setQuickSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickSearch()}
                disabled={isQuickSearching}
              />
              <Button 
                onClick={handleQuickSearch} 
                disabled={isQuickSearching}
                className="min-w-[100px]"
              >
                {isQuickSearching ? "검색 중..." : "검색"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * 맛보기 검색은 최근 3개월 데이터를 대상으로 합니다
            </p>
          </CardContent>
        </Card>

        {/* Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <FolderKanban className="h-6 w-6 text-primary" />
              최근 프로젝트
            </h2>
            <Button
              variant="outline"
              onClick={() => navigate("/projects")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              새 프로젝트
            </Button>
          </div>

          {isLoadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full mt-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">아직 프로젝트가 없습니다</p>
                <Button onClick={() => navigate("/projects")}>
                  첫 프로젝트 만들기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || "설명 없음"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">등록 키워드</span>
                      <span className="font-semibold text-foreground">
                        {project.keywordCount}개
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        검색 횟수
                      </span>
                      <span className="font-semibold text-foreground">
                        {project.searchCount}회
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(project.updated_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {projects.length > 0 && (
            <div className="text-center pt-4">
              <Button variant="ghost" onClick={() => navigate("/projects")}>
                전체 프로젝트 보기 →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
