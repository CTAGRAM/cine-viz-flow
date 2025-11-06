import { useState } from 'react';
import { Search as SearchIcon, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/BookCard';
import { bookStore } from '@/lib/bookStore';
import { Book } from '@/lib/dataStructures';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(10);
  const [foundInBucket, setFoundInBucket] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a search query",
        description: "Please enter a movie ID or title to search",
        variant: "destructive"
      });
      return;
    }

    // Try exact ID search first
    const exactMatch = await bookStore.searchBook(searchQuery.trim());
    
    if (exactMatch) {
      setFoundInBucket(0); // Mark as found via hash table
      setResults([exactMatch]);
      toast({
        title: "Movie found! 🎬",
        description: `Found "${exactMatch.name}" via Hash Table lookup`
      });
    } else {
      // Fallback to title search
      const allBooks = bookStore.getAllBooks();
      const filtered = allBooks.filter(book =>
        book.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        book.rating >= minRating &&
        book.rating <= maxRating
      );
      
      setFoundInBucket(null);
      setResults(filtered);
      
      if (filtered.length === 0) {
        toast({
          title: "No results",
          description: "No movies match your search criteria",
          variant: "destructive"
        });
      } else {
        toast({
          title: `Found ${filtered.length} movie${filtered.length > 1 ? 's' : ''}`,
          description: "Results filtered by title and rating"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Search Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Search Movies</h1>
          <p className="text-muted-foreground">
            Search by Movie ID (Hash Table lookup) or Title (AVL Tree traversal)
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4">
          <Input
            placeholder="Enter Movie ID or Title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="text-lg h-14"
          />
          <Button onClick={handleSearch} size="lg" className="px-8">
            <SearchIcon className="h-5 w-5 mr-2" />
            Search
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-6 space-y-6">
          <h3 className="font-semibold">Filters</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Rating Range: {minRating.toFixed(1)} - {maxRating.toFixed(1)}
              </label>
              <div className="flex gap-4 items-center">
                <span className="text-xs text-muted-foreground min-w-[30px]">{minRating.toFixed(1)}</span>
                <Slider
                  value={[minRating, maxRating]}
                  min={0}
                  max={10}
                  step={0.1}
                  onValueChange={([min, max]) => {
                    setMinRating(min);
                    setMaxRating(max);
                  }}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground min-w-[30px]">{maxRating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {results.length} Result{results.length > 1 ? 's' : ''}
              </h2>
              {foundInBucket !== null && (
                <Button
                  onClick={() => navigate('/visualizer')}
                  variant="outline"
                  size="lg"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Search Path in Visualizer
                </Button>
              )}
            </div>
            {foundInBucket !== null && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <p className="text-sm">
                  <span className="font-semibold">Found via Hash Table lookup!</span>
                  <span className="text-muted-foreground ml-2">Click "View Search Path" to see the visualization.</span>
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {results.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        ) : searchQuery && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search query or filters
            </p>
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && results.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold mb-2">Start searching</h3>
            <p className="text-muted-foreground">
              Enter a movie ID or title above to find movies
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
