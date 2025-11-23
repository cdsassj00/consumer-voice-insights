import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderKanban, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProjectModal } from "@/components/ProjectModal";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "프로젝트 조회 실패",
        description: "프로젝트 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("정말 이 프로젝트를 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_active: false })
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "프로젝트 삭제 완료",
        description: "프로젝트가 삭제되었습니다.",
      });
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "프로젝트 삭제 실패",
        description: "프로젝트 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    fetchProjects();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">프로젝트를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">프로젝트 관리</h1>
          <p className="text-muted-foreground mt-2">
            제품/서비스별로 키워드를 그룹화하고 체계적으로 관리하세요
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          새 프로젝트
        </Button>
      </div>

      {/* Project Grid */}
      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">프로젝트가 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              첫 프로젝트를 생성하여 키워드를 체계적으로 관리해보세요
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              프로젝트 생성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || "설명 없음"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {project.project_type || "기타"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>마지막 업데이트</span>
                  <span>{new Date(project.updated_at).toLocaleDateString("ko-KR")}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(project)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        open={isModalOpen}
        onClose={handleModalClose}
        project={editingProject}
      />
    </div>
  );
}
