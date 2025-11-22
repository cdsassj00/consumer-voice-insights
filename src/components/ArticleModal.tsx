import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const ArticleModal = ({ isOpen, onClose, url, title }: ArticleModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="line-clamp-1">{title}</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="ghost" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                새 탭에서 열기
              </Button>
            </a>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden rounded-lg border">
          <iframe
            src={url}
            className="w-full h-full"
            title={title}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
