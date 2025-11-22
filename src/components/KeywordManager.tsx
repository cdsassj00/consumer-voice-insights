import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Keyword {
  id: string;
  category: 'brand' | 'product' | 'service' | 'other';
  keyword: string;
  is_active: boolean;
}

const CATEGORY_LABELS = {
  brand: '브랜드',
  product: '제품',
  service: '서비스',
  other: '기타',
};

export const KeywordManager = ({ userId }: { userId: string }) => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategory, setNewCategory] = useState<'brand' | 'product' | 'service' | 'other'>('brand');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching keywords:', error);
      return;
    }

    setKeywords((data as Keyword[]) || []);
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
        category: newCategory,
        keyword: newKeyword.trim(),
        user_id: userId,
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
    const { error } = await supabase
      .from('keywords')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "삭제 실패",
        description: "키워드 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "삭제 완료",
        description: "키워드가 삭제되었습니다.",
      });
      await fetchKeywords();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>키워드 관리</CardTitle>
        <CardDescription>
          검색할 키워드를 카테고리별로 등록하고 관리하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new keyword */}
        <div className="flex gap-2">
          <Select value={newCategory} onValueChange={(value: any) => setNewCategory(value)}>
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

        {/* Keywords list */}
        <div className="space-y-2">
          {keywords.map((kw) => (
            <div
              key={kw.id}
              className="flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
            >
              <Badge variant="secondary" className="shrink-0">
                {CATEGORY_LABELS[kw.category]}
              </Badge>
              
              {editingId === kw.id ? (
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
              ) : (
                <span className="flex-1 font-medium">{kw.keyword}</span>
              )}

              <div className="flex gap-1">
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
          ))}

          {keywords.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              등록된 키워드가 없습니다
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
