import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
}

const projectTypes = [
  { value: "product", label: "제품" },
  { value: "service", label: "서비스" },
  { value: "brand", label: "브랜드" },
  { value: "other", label: "기타" },
];

export function ProjectModal({ open, onClose, project }: ProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("product");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setProjectType(project.project_type || "product");
    } else {
      setName("");
      setDescription("");
      setProjectType("product");
    }
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "프로젝트 이름 필요",
        description: "프로젝트 이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      if (project) {
        // Update existing project
        const { error } = await supabase
          .from("projects")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            project_type: projectType,
            updated_at: new Date().toISOString(),
          })
          .eq("id", project.id);

        if (error) throw error;

        toast({
          title: "프로젝트 수정 완료",
          description: "프로젝트가 성공적으로 수정되었습니다.",
        });
      } else {
        // Create new project
        const { error } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            name: name.trim(),
            description: description.trim() || null,
            project_type: projectType,
          });

        if (error) throw error;

        toast({
          title: "프로젝트 생성 완료",
          description: "새 프로젝트가 생성되었습니다.",
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "프로젝트 저장 실패",
        description: "프로젝트 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{project ? "프로젝트 수정" : "새 프로젝트 생성"}</DialogTitle>
          <DialogDescription>
            제품이나 서비스를 체계적으로 관리하기 위한 프로젝트를 만드세요
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">프로젝트 이름 *</Label>
              <Input
                id="name"
                placeholder="예: 갤럭시 S24 모니터링"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">프로젝트 타입</Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : project ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
