import { useState, useEffect } from 'react';
import { Search as SearchIcon, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/BookCard';
import { bookStore } from '@/lib/bookStore';
import { bookTrie } from '@/lib/trieDataStructure';
import { Book } from '@/lib/dataStructures';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(10);
  const [foundInBucket, setFoundInBucket] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load books into trie on mount
  useEffect(() => {
    const allBooks = bookStore.getAllBooks();
    bookTrie.buildFromBooks(allBooks);
  }, []);

  // Handle search query changes for autocomplete
  const handleQueryChange = (value: string) => {
    setSearchQuery(value);
    
    if (value.trim().length >= 2) {
      const matches = bookTrie.search(value.trim());
      setSuggestions(matches.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    
    if (!searchTerm.trim()) {
      toast({
        title: "Enter a search query",
        description: "Please enter a book ID or title to search",
        variant: "destructive"
      });
      return;
    }

    // Try exact ID search first via Hash Table
    const exactMatch = await bookStore.searchBook(searchTerm.trim());
    
    if (exactMatch) {
      setFoundInBucket(0);
      setResults([exactMatch]);
      toast({
        title: "Book found! 📚",
        description: `Found "${exactMatch.name}" via Hash Table lookup`
      });
    } else {
      // Fallback to title search using Trie
      const bookIds = bookTrie.searchBookIds(searchTerm.trim());
      const allBooks = bookStore.getAllBooks();
      const filtered = allBooks.filter(book =>
        bookIds.includes(book.id) &&
        book.rating >= minRating &&
        book.rating <= maxRating
      );
      
      setFoundInBucket(null);
      setResults(filtered);
      
      if (filtered.length === 0) {
        toast({
          title: "No results",
          description: "No books match your search criteria",
          variant: "destructive"
        });
      } else {
        toast({
          title: `Found ${filtered.length} book${filtered.length > 1 ? 's' : ''}`,
          description: "Results found using Trie search"
        });
      }
    }
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Search Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Search Books</h1>
          <p className="text-muted-foreground">
            Search by ISBN (Hash Table lookup) or Title (AVL Tree traversal)
          </p>
        </div>

        {/* Search Bar with Autocomplete */}
        <div className="relative flex gap-4">
          <div className="flex-1 relative">
            <Input
              placeholder="Enter ISBN or Book Title..."
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="text-lg h-14"
            />
            
            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-card border rounded-lg shadow-lg z-10 max-h-[300px] overflow-hidden">
                <ScrollArea className="h-full max-h-[300px]">
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground px-3 py-2 font-semibold">
                      Suggestions from Trie
                    </div>
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-2 hover:bg-muted rounded-md transition-colors"
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{suggestion}</span>
                          <Badge variant="outline" className="text-xs">
                            Match
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
          <Button onClick={() => handleSearch()} size="lg" className="px-8">
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
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Start searching</h3>
            <p className="text-muted-foreground">
              Enter an ISBN or book title above to find books
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
