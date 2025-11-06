import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star } from "lucide-react";

interface BookPreviewCardProps {
  title: string;
  author: string;
  rating: string;
  subject: string;
  condition: string;
  posterUrl: string;
  year: string;
}

export function BookPreviewCard({
  title,
  author,
  rating,
  subject,
  condition,
  posterUrl,
  year,
}: BookPreviewCardProps) {
  const hasContent = title || author || posterUrl;

  if (!hasContent) {
    return (
      <Card className="p-6 sticky top-6">
        <div className="text-center space-y-3 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto opacity-50" />
          <p className="text-sm">Preview will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 sticky top-6 space-y-4">
      <h3 className="font-semibold text-sm text-muted-foreground">Live Preview</h3>
      
      <div className="space-y-4">
        {posterUrl && (
          <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden">
            <img
              src={posterUrl}
              alt={title || "Book cover"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://via.placeholder.com/300x450/1a1a1a/ffffff?text=${encodeURIComponent(title || "Book")}`;
              }}
            />
          </div>
        )}

        <div className="space-y-2">
          {title && (
            <h4 className="font-semibold text-lg leading-tight">{title}</h4>
          )}
          
          {author && (
            <p className="text-sm text-muted-foreground">{author}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {subject && (
              <Badge variant="secondary">{subject}</Badge>
            )}
            {condition && (
              <Badge variant="outline">{condition}</Badge>
            )}
          </div>

          {rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span className="font-medium">{rating}</span>
              <span className="text-muted-foreground">/ 5.0</span>
            </div>
          )}

          {year && (
            <p className="text-xs text-muted-foreground">Published: {year}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
