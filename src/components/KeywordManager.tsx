import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit2, Save, X, Star, Clock, BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface Keyword {
  id: string;
  category: string | null;
  keyword: string;
  is_active: boolean;
  is_favorite: boolean;
  search_count: number;
  last_searched_at: string | null;
  source: string;
  project_id: string | null;
}

type Project = Tables<"projects">;

const CATEGORY_LABELS: Record<string, string> = {
  brand: '브랜드',
  product: '제품',
  service: '서비스',
  other: '기타',
};

export const KeywordManager = ({ userId }: { userId: string }) => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategory, setNewCategory] = useState<string>('brand');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchKeywords();
    fetchProjects();
  }, [userId]);

  const fetchKeywords = async () => {
    try {
      const { data, error } = await supabase
        .from("keywords")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("last_searched_at", { ascending: false });

      if (error) throw error;
      setKeywords(data || []);
    } catch (error) {
      console.error("Error fetching keywords:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleAdd = async () => {
    if (!newKeyword.trim()) {
      toast({
        title: "키워드를 입력하세요",
        description: "추가할 키워드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    
    const { error } = await supabase
      .from('keywords')
      .insert([{
        category: newCategory || null,
        keyword: newKeyword.trim(),
        user_id: userId,
        source: 'manual',
        search_count: 0,
      }]);

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "중복 키워드",
          description: "이미 등록된 키워드입니다.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "추가 실패",
          description: "키워드 추가 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "추가 완료",
        description: "키워드가 등록되었습니다.",
      });
      setNewKeyword("");
      await fetchKeywords();
    }
    
    setIsAdding(false);
  };

  const handleEdit = (id: string, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) {
      toast({
        title: "키워드를 입력하세요",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('keywords')
      .update({ keyword: editText.trim() })
      .eq('id', id);

    if (error) {
      toast({
        title: "수정 실패",
        description: "키워드 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "수정 완료",
        description: "키워드가 수정되었습니다.",
      });
      setEditingId(null);
      await fetchKeywords();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 키워드를 삭제하시겠습니까?")) return;
    
    try {
      const { error } = await supabase
        .from("keywords")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      setKeywords(keywords.filter((k) => k.id !== id));
      toast({
        title: "키워드 삭제 완료",
        description: "키워드가 삭제되었습니다.",
      });
    } catch (error) {
      console.error("Error deleting keyword:", error);
      toast({
        title: "키워드 삭제 실패",
        variant: "destructive",
      });
    }
  };

  const handleProjectAssign = async (keywordId: string, projectId: string | null) => {
    try {
      const { error } = await supabase
        .from("keywords")
        .update({ project_id: projectId === "none" ? null : projectId })
        .eq("id", keywordId);

      if (error) throw error;

      setKeywords(keywords.map((k) =>
        k.id === keywordId ? { ...k, project_id: projectId === "none" ? null : projectId } : k
      ));

      toast({
        title: "프로젝트 할당 완료",
        description: projectId === "none" ? "프로젝트 할당이 해제되었습니다." : "프로젝트에 할당되었습니다.",
      });
    } catch (error) {
      console.error("Error assigning project:", error);
      toast({
        title: "프로젝트 할당 실패",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("keywords")
        .update({ is_favorite: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setKeywords(keywords.map((k) => (k.id === id ? { ...k, is_favorite: !currentStatus } : k)));
      toast({
        title: currentStatus ? "즐겨찾기 해제" : "즐겨찾기 추가",
        description: currentStatus ? "즐겨찾기에서 제거되었습니다." : "즐겨찾기에 추가되었습니다.",
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "즐겨찾기 변경 실패",
        variant: "destructive",
      });
    }
  };

  const favoriteKeywords = keywords.filter(k => k.is_favorite);
  const searchHistory = keywords.filter(k => k.search_count > 0);

  const renderKeywordItem = (kw: Keyword, showStats: boolean = true) => {
    const assignedProject = projects.find((p) => p.id === kw.project_id);
    
    return (
      <div
        key={kw.id}
        className="flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={() => toggleFavorite(kw.id, kw.is_favorite)}
          className="shrink-0"
        >
          <Star className={`w-4 h-4 ${kw.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
        </Button>

        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {kw.category && (
            <Badge variant="secondary" className="shrink-0">
              {CATEGORY_LABELS[kw.category] || kw.category}
            </Badge>
          )}
          
          {editingId === kw.id ? (
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1"
              autoFocus
            />
          ) : (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{kw.keyword}</span>
                {assignedProject && (
                  <Badge variant="outline" className="text-xs">
                    {assignedProject.name}
                  </Badge>
                )}
              </div>
              {showStats && kw.search_count > 0 && (
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BarChart className="w-3 h-3" />
                    검색 {kw.search_count}회
                  </span>
                  {kw.last_searched_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(kw.last_searched_at), { 
                        addSuffix: true, 
                        locale: ko 
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <Select
          value={kw.project_id || "none"}
          onValueChange={(value) => handleProjectAssign(kw.id, value)}
        >
          <SelectTrigger className="w-[140px] shrink-0">
            <SelectValue placeholder="프로젝트" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">프로젝트 없음</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1 shrink-0">
          {editingId === kw.id ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSaveEdit(kw.id)}
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingId(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(kw.id, kw.keyword)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(kw.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>키워드 라이브러리</CardTitle>
        <CardDescription>
          검색하면 자동으로 저장되며, 즐겨찾기와 통계를 관리할 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="favorites">
              즐겨찾기 ({favoriteKeywords.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              검색 이력 ({searchHistory.length})
            </TabsTrigger>
            <TabsTrigger value="add">
              수동 추가
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="space-y-2 mt-4">
            {favoriteKeywords.length > 0 ? (
              <div className="space-y-2">
                {favoriteKeywords.map(kw => renderKeywordItem(kw))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>즐겨찾기한 키워드가 없습니다</p>
                <p className="text-sm mt-1">별 아이콘을 클릭하여 즐겨찾기에 추가하세요</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-2 mt-4">
            {searchHistory.length > 0 ? (
              <div className="space-y-2">
                {searchHistory.map(kw => renderKeywordItem(kw))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>검색 이력이 없습니다</p>
                <p className="text-sm mt-1">키워드를 검색하면 자동으로 이력에 추가됩니다</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brand">브랜드</SelectItem>
                    <SelectItem value="product">제품</SelectItem>
                    <SelectItem value="service">서비스</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="키워드 입력 (예: 올리브영, 브링그린)"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="flex-1"
                />
                <Button onClick={handleAdd} disabled={isAdding}>
                  <Plus className="w-4 h-4 mr-2" />
                  추가
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground bg-accent/50 p-3 rounded-lg">
                <p>💡 <strong>Tip:</strong> 카테고리는 선택사항입니다</p>
                <p className="mt-1">직접 검색하면 자동으로 이력에 추가되므로, 중요한 키워드만 수동으로 등록하세요</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
