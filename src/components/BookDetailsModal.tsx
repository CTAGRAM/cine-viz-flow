import { Book } from '@/lib/dataStructures';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, Hash, Heart, Edit, User, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface BookDetailsModalProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookDetailsModal({ book, open, onOpenChange }: BookDetailsModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isInList, setIsInList] = useState(false);

  useEffect(() => {
    if (book) {
      const myList = JSON.parse(localStorage.getItem('myList') || '[]');
      setIsInList(myList.some((b: Book) => b.id === book.id));
    }
  }, [book]);

  if (!book) return null;

  const toggleMyList = () => {
    const myList: Book[] = JSON.parse(localStorage.getItem('myList') || '[]');
    
    if (isInList) {
      const updated = myList.filter(b => b.id !== book.id);
      localStorage.setItem('myList', JSON.stringify(updated));
      setIsInList(false);
      toast({
        title: "Removed from wishlist",
        description: `"${book.name}" removed from your wishlist`
      });
    } else {
      myList.push(book);
      localStorage.setItem('myList', JSON.stringify(myList));
      setIsInList(true);
      toast({
        title: "Added to wishlist",
        description: `"${book.name}" added to your wishlist`
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-display">{book.name}</DialogTitle>
          {book.author && (
            <p className="text-muted-foreground italic">by {book.author}</p>
          )}
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Book Cover */}
          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center">
            {book.posterUrl ? (
              <img
                src={book.posterUrl}
                alt={book.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-6xl font-display font-bold text-muted-foreground">
                {book.name[0]}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-sm">
                <Star className="h-3 w-3 mr-1 fill-primary text-primary" />
                {book.rating.toFixed(1)}
              </Badge>
              
              {book.year && (
                <Badge variant="outline" className="text-sm">
                  <Calendar className="h-3 w-3 mr-1" />
                  {book.year}
                </Badge>
              )}

              {book.subject && (
                <Badge variant="outline" className="text-sm">
                  {book.subject}
                </Badge>
              )}

              {book.condition && (
                <Badge variant="outline" className="text-sm">
                  <Package className="h-3 w-3 mr-1" />
                  {book.condition}
                </Badge>
              )}
            </div>

            {/* Book Info */}
            <div className="space-y-3 text-sm">
              {book.owner && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Owner:</span>
                  <span className="font-medium">{book.owner}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">ISBN:</span>
                <span className="font-mono text-xs">{book.id}</span>
              </div>
              
              {book.available !== undefined && (
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${book.available ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium">{book.available ? 'Available' : 'Not Available'}</span>
                </div>
              )}
            </div>

            {/* Synopsis Placeholder */}
            <div className="space-y-2">
              <h3 className="font-semibold">About this book</h3>
              <p className="text-sm text-muted-foreground">
                {book.name} is a highly-rated book in the {book.subject || 'general'} category
                with a quality score of {book.rating.toFixed(1)} out of 10.
                {book.owner && ` Currently offered by ${book.owner}.`}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={toggleMyList}
              >
                <Heart className={`h-4 w-4 mr-2 ${isInList ? 'fill-current' : ''}`} />
                {isInList ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigate(`/add?id=${book.id}`);
                  onOpenChange(false);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Book
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigate('/visualizer');
                  onOpenChange(false);
                }}
              >
                Focus in Structures
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Legacy export for backward compatibility
export { BookDetailsModal as MovieDetailsModal };
