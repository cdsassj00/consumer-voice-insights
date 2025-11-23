import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Settings, 
  Search, 
  Star, 
  Plus,
  Trash2,
  BarChart,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProjectModal } from "@/components/ProjectModal";
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

type Project = Tables<"projects">;
type Keyword = Tables<"keywords">;

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [availableKeywords, setAvailableKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();

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

      // Fetch keywords assigned to this project
      const { data: keywordsData, error: keywordsError } = await supabase
        .from("keywords")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_active", true)
        .order("keyword");

      if (keywordsError) throw keywordsError;
      setKeywords(keywordsData || []);

      // Fetch available keywords (not assigned to any project)
      const { data: availableData, error: availableError } = await supabase
        .from("keywords")
        .select("*")
        .eq("user_id", user.id)
        .is("project_id", null)
        .eq("is_active", true)
        .order("keyword");

      if (availableError) throw availableError;
      setAvailableKeywords(availableData || []);
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

  const handleRemoveKeyword = async (keywordId: string) => {
    if (!confirm("이 키워드를 프로젝트에서 제거하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("keywords")
        .update({ project_id: null })
        .eq("id", keywordId);

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
    }
  };

  const handleProjectSearch = () => {
    // Phase 2.4에서 구현 예정
    toast({
      title: "곧 제공될 기능입니다",
      description: "프로젝트 전체 검색은 Phase 2.4에서 구현 예정입니다.",
    });
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
          <Button onClick={handleProjectSearch} size="lg">
            <Search className="mr-2 h-4 w-4" />
            프로젝트 전체 검색
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

      {/* Keywords Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assigned Keywords */}
        <Card>
          <CardHeader>
            <CardTitle>할당된 키워드 ({keywords.length})</CardTitle>
            <CardDescription>
              이 프로젝트에 할당된 키워드 목록입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                        <span className="font-medium">{keyword.keyword}</span>
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
        <Card>
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
                        {keyword.keyword}
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
                        <span className="font-medium">{keyword.keyword}</span>
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

      {/* Project Modal */}
      <ProjectModal
        open={isModalOpen}
        onClose={handleModalClose}
        project={project}
      />
    </div>
  );
}
