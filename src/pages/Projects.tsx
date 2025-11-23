import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderKanban, Edit, Trash2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProjectModal } from "@/components/ProjectModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Tables } from "@/integrations/supabase/types";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

type Project = Tables<"projects">;

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [runTour, setRunTour] = useState(false);
  const { toast } = useToast();

  const tourSteps: Step[] = [
    {
      target: '[data-tour="first-project"]',
      content: '자동으로 생성된 첫 프로젝트입니다. 클릭하여 들어가면 키워드 설정과 검색을 시작할 수 있습니다.',
      disableBeacon: true,
      placement: 'bottom',
    },
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Check for first login
    const isFirstLogin = localStorage.getItem('first-login');
    
    if (isFirstLogin === 'true' && projects.length > 0) {
      // Show quick tour before auto-redirecting
      setTimeout(() => {
        setRunTour(true);
      }, 800);
      
      // Auto-redirect after tour or timeout
      setTimeout(() => {
        localStorage.removeItem('first-login');
        navigate(`/projects/${projects[0].id}`);
      }, 4000);
    }
  }, [projects, navigate]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      // Redirect immediately when tour is skipped/finished
      if (projects.length > 0) {
        localStorage.removeItem('first-login');
        navigate(`/projects/${projects[0].id}`);
      }
    }
  };

  const fetchProjects = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log("🔍 Auth check:", { user: user?.email, userId: user?.id, authError });
      
      if (authError || !user) {
        console.error("❌ No authenticated user:", authError);
        toast({
          title: "로그인 필요",
          description: "로그인 후 이용해주세요.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      console.log("✅ Fetching projects for user:", user.email);

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      console.log("📦 Projects query result:", { data, error, count: data?.length });

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

  const handleDelete = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_active: false })
        .eq("id", projectToDelete);

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
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
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
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
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
            primaryColor: 'hsl(266, 89%, 68%)',
            zIndex: 10000,
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          },
        }}
      />
      
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
          {projects.map((project, index) => (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
              data-tour={index === 0 ? "first-project" : undefined}
            >
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
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${project.id}`);
                    }}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    상세보기
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(project);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="프로젝트 삭제"
        description="정말 이 프로젝트를 삭제하시겠습니까? 삭제된 프로젝트는 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
