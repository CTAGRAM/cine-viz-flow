import { useEffect, useState } from 'react';
import { BookCard } from '@/components/BookCard';
import { Book } from '@/lib/dataStructures';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MyList() {
  const [myList, setMyList] = useState<Book[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadMyList();
  }, []);

  const loadMyList = () => {
    const stored = localStorage.getItem('myList');
    if (stored) {
      setMyList(JSON.parse(stored));
    }
  };

  const removeFromList = (movieId: string) => {
    const updated = myList.filter(m => m.id !== movieId);
    setMyList(updated);
    localStorage.setItem('myList', JSON.stringify(updated));
    
    toast({
      title: "Removed from list",
      description: "Movie has been removed from your list"
    });
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire list?')) {
      setMyList([]);
      localStorage.removeItem('myList');
      
      toast({
        title: "List cleared",
        description: "All movies have been removed from your list"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">My List</h1>
            <p className="text-muted-foreground">
              {myList.length} movie{myList.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          
          {myList.length > 0 && (
            <Button
              variant="destructive"
              onClick={clearAll}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Movie Grid */}
        {myList.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {myList.map((book) => (
              <div key={book.id} className="relative group">
                <BookCard book={book} />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFromList(book.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-24">
            <div className="text-8xl mb-6">📝</div>
            <h2 className="text-3xl font-bold mb-4">Your list is empty</h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Start adding movies to your list to keep track of what you want to watch
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
