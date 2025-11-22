import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string | null;
  keyword: string;
  article_published_at: string | null;
}

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: SearchResult[];
  title: string;
}

export const ArticleModal = ({ isOpen, onClose, articles, title }: ArticleModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Badge variant="secondary">{articles.length}개 게시글</Badge>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {articles.map((article) => (
              <div key={article.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-semibold text-foreground flex-1">{article.title}</h4>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
                {article.snippet && (
                  <p className="text-sm text-muted-foreground mb-2">{article.snippet}</p>
                )}
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{article.keyword}</Badge>
                  {article.article_published_at && (
                    <span>{new Date(article.article_published_at).toLocaleDateString('ko-KR')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
