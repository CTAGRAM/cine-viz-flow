import { Book } from "@/lib/dataStructures";
import { BookOpen, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { BookDetailsModal } from "./BookDetailsModal";

interface BookCardProps {
  book: Book;
  ownerId?: string;
  ownerEmail?: string;
  onDetails?: () => void;
  className?: string;
}

export const BookCard = ({ book, ownerId, ownerEmail, onDetails, className }: BookCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <div
      className={cn(
        "group relative aspect-[2/3] rounded-lg overflow-hidden bg-card border border-border cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-lg",
        className
      )}
      onClick={() => {
        if (onDetails) {
          onDetails();
        } else {
          setShowDetails(true);
        }
      }}
    >
      {book.posterUrl ? (
        <img
          src={book.posterUrl}
          alt={book.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-muted to-accent flex items-center justify-center">
          <span className="text-4xl font-display font-bold text-muted-foreground">
            {book.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <h3 className="font-semibold text-base line-clamp-2">{book.name}</h3>
          
          {book.author && (
            <p className="text-xs text-muted-foreground italic line-clamp-1">by {book.author}</p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-2 py-0.5 bg-primary text-primary-foreground rounded text-xs font-bold">
              ⭐ {book.rating.toFixed(1)}
            </div>
            {book.subject && (
              <div className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
                {book.subject}
              </div>
            )}
            {book.condition && (
              <div className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs">
                {book.condition}
              </div>
            )}
            {!book.available && (
              <div className="px-2 py-0.5 bg-red-500 text-white rounded text-xs font-bold">
                Reserved
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-xs font-semibold transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
            >
              <BookOpen className="w-3 h-3" />
              View Details
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDetails?.();
              }}
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <BookDetailsModal
      book={book}
      open={showDetails}
      onOpenChange={setShowDetails}
      ownerId={ownerId}
      ownerEmail={ownerEmail}
    />
    </>
  );
};

// Legacy export for backward compatibility
export { BookCard as MovieCard };
