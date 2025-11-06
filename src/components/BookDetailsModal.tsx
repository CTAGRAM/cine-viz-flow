import { Book } from '@/lib/dataStructures';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, Hash, Edit, User, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RequestBookDialog } from '@/components/RequestBookDialog';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BookDetailsModalProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerId?: string;
  ownerEmail?: string;
}

export function BookDetailsModal({ book, open, onOpenChange, ownerId, ownerEmail }: BookDetailsModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (book && user) {
      fetchRequestCount();
    }
  }, [book, user]);

  const fetchRequestCount = async () => {
    if (!book || !user) return;

    try {
      const { count } = await supabase
        .from('book_requests')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', book.id)
        .eq('status', 'pending');

      setRequestCount(count || 0);
    } catch (error) {
      console.error('Error fetching request count:', error);
    }
  };

  if (!book) return null;

  const isOwner = user?.id === ownerId;

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
                  <span className="font-medium">{book.available ? 'Available' : 'Reserved'}</span>
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
              {!isOwner && ownerId && book.available && (
                <RequestBookDialog
                  bookId={book.id}
                  bookTitle={book.name}
                  ownerId={ownerId}
                  ownerEmail={ownerEmail}
                  onRequestSent={() => {
                    fetchRequestCount();
                    onOpenChange(false);
                  }}
                />
              )}

              {!isOwner && ownerId && !book.available && (
                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                    This book is currently reserved for another exchange
                  </p>
                </div>
              )}

              {isOwner && (
                <>
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

                  {requestCount > 0 && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        navigate('/requests');
                        onOpenChange(false);
                      }}
                    >
                      View {requestCount} Pending Request{requestCount !== 1 ? 's' : ''}
                    </Button>
                  )}
                </>
              )}

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
