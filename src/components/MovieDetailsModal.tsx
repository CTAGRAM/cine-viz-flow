import { Movie } from '@/lib/dataStructures';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, Hash, Heart, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface MovieDetailsModalProps {
  movie: Movie | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MovieDetailsModal({ movie, open, onOpenChange }: MovieDetailsModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isInList, setIsInList] = useState(false);

  useEffect(() => {
    if (movie) {
      const myList = JSON.parse(localStorage.getItem('myList') || '[]');
      setIsInList(myList.some((m: Movie) => m.id === movie.id));
    }
  }, [movie]);

  if (!movie) return null;

  const toggleMyList = () => {
    const myList: Movie[] = JSON.parse(localStorage.getItem('myList') || '[]');
    
    if (isInList) {
      const updated = myList.filter(m => m.id !== movie.id);
      localStorage.setItem('myList', JSON.stringify(updated));
      setIsInList(false);
      toast({
        title: "Removed from list",
        description: `"${movie.name}" removed from your list`
      });
    } else {
      myList.push(movie);
      localStorage.setItem('myList', JSON.stringify(myList));
      setIsInList(true);
      toast({
        title: "Added to list",
        description: `"${movie.name}" added to your list`
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-3xl">{movie.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Poster */}
          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-6xl font-bold text-muted-foreground">
                {movie.name[0]}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-sm">
                <Star className="h-3 w-3 mr-1 fill-primary text-primary" />
                {movie.rating.toFixed(1)}
              </Badge>
              
              {movie.year && (
                <Badge variant="outline" className="text-sm">
                  <Calendar className="h-3 w-3 mr-1" />
                  {movie.year}
                </Badge>
              )}

              <Badge variant="outline" className="text-sm font-mono">
                <Hash className="h-3 w-3 mr-1" />
                {movie.id}
              </Badge>
            </div>

            {/* Synopsis Placeholder */}
            <div className="space-y-2">
              <h3 className="font-semibold">Synopsis</h3>
              <p className="text-sm text-muted-foreground">
                A compelling story about {movie.name}. This movie has received critical acclaim
                with a rating of {movie.rating.toFixed(1)} out of 10.
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
                {isInList ? 'Remove from My List' : 'Add to My List'}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigate(`/add?id=${movie.id}`);
                  onOpenChange(false);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Movie
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
