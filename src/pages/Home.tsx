import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/lib/dataStructures";
import { BookCard } from "@/components/BookCard";
import { BookOpen, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-placeholder.jpg";

export default function Home() {
  const location = useLocation();
  const [books, setBooks] = useState<Book[]>([]);
  const [booksWithOwner, setBooksWithOwner] = useState<{ book: Book; ownerId: string }[]>([]);
  const [topRated, setTopRated] = useState<Book[]>([]);
  const [hero, setHero] = useState<Book | null>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        // Fetch all books from Supabase
        const { data: booksData, error } = await supabase
          .from('books')
          .select(`
            *,
            profiles:owner_user_id (full_name)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching books:', error);
          return;
        }

        // Convert Supabase data to Book format with owner_user_id
        const booksWithOwnerData = (booksData || []).map((book: any) => ({
          book: {
            id: book.id,
            name: book.title,
            rating: book.rating,
            author: book.author,
            subject: book.subject,
            condition: book.condition,
            year: book.year,
            posterUrl: book.poster_url,
            owner: book.profiles?.full_name || 'Unknown',
            available: book.available,
          },
          ownerId: book.owner_user_id,
        }));

        setBooksWithOwner(booksWithOwnerData);
        const convertedBooks: Book[] = booksWithOwnerData.map(b => b.book);
        setBooks(convertedBooks);

        // Get top rated books (sorted by rating)
        const topBooks = [...convertedBooks]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 10);
        setTopRated(topBooks);

        if (topBooks.length > 0) {
          setHero(topBooks[0]);
        }
      } catch (error) {
        console.error('Error loading books:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [location]);

  // Auto-rotate hero slideshow every 5 seconds
  useEffect(() => {
    if (topRated.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % Math.min(topRated.length, 6));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [topRated.length]);

  // Update hero when index changes
  useEffect(() => {
    if (topRated.length > 0) {
      setHero(topRated[currentHeroIndex]);
    }
  }, [currentHeroIndex, topRated]);

  const scrollContainer = (direction: 'left' | 'right', containerId: string) => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {loading ? (
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Loading books...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          {hero && (
        <div className="relative h-[70vh] w-full overflow-hidden">
          {/* Background with poster */}
          <div className="absolute inset-0">
            <img
              key={hero.id}
              src={hero.posterUrl || heroImage}
              alt={hero.name}
              className="w-full h-full object-cover animate-fade-in"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between px-16 py-8">
            {/* Top carousel indicators */}
            <div className="flex justify-center gap-2">
              {topRated.slice(0, 6).map((book, index) => (
                <button
                  key={book.id}
                  onClick={() => setCurrentHeroIndex(index)}
                  className={`transition-all ${
                    index === currentHeroIndex
                      ? 'w-12 h-1 bg-primary'
                      : 'w-8 h-1 bg-primary/50 hover:bg-primary/70'
                  }`}
                  aria-label={`View ${book.name}`}
                />
              ))}
            </div>

            {/* Bottom content */}
            <div className="max-w-2xl">
              <div key={hero.id} className="space-y-4 animate-slide-up">
                <div className="flex items-center gap-2 text-sm">
                  <div className="px-2 py-1 bg-primary text-primary-foreground rounded font-display">📚</div>
                  <span className="text-foreground/70">AVAILABLE NOW</span>
                </div>

                <h1 className="text-6xl font-display font-bold tracking-tight">{hero.name}</h1>
                
                {hero.author && (
                  <p className="text-xl italic text-foreground/80">by {hero.author}</p>
                )}

                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-primary text-primary-foreground rounded-lg font-bold">
                      ⭐ {hero.rating}/10
                    </div>
                    <span className="font-semibold">Quality Score</span>
                  </div>
                  {hero.subject && (
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg">{hero.subject}</span>
                  )}
                  {hero.condition && (
                    <span className="px-3 py-1 bg-accent text-accent-foreground rounded-lg">{hero.condition}</span>
                  )}
                  {hero.year && (
                    <span className="text-muted-foreground">{hero.year}</span>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                  <BookOpen className="w-5 h-5" />
                  Request Book
                </Button>
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Info className="w-5 h-5" />
                    More Info
                  </Button>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Carousels */}
        <div className="space-y-12 px-16 py-12">
          {/* Top Rated */}
          {topRated.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Most Requested Books</h2>
              <button 
                onClick={() => window.location.href = '/visualizer'}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View in Visualizer
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="relative group">
              <div
                id="top-rated-carousel"
                className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2"
              >
                {topRated.map((book) => {
                  const ownerData = booksWithOwner.find(b => b.book.id === book.id);
                  return (
                    <div key={book.id} className="flex-none w-48 snap-start">
                      <BookCard book={book} ownerId={ownerData?.ownerId} />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Recently Added */}
        {books.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Recently Added</h2>
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                Explore All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="relative group">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2">
                {books.slice(0, 12).reverse().map((book) => {
                  const ownerData = booksWithOwner.find(b => b.book.id === book.id);
                  return (
                    <div key={book.id} className="flex-none w-48 snap-start">
                      <BookCard book={book} ownerId={ownerData?.ownerId} />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* All Books */}
        {books.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Browse All</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {books.slice(0, 18).map((book) => {
                const ownerData = booksWithOwner.find(b => b.book.id === book.id);
                return <BookCard key={book.id} book={book} ownerId={ownerData?.ownerId} />;
              })}
            </div>
          </section>
        )}

        {books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-3xl font-bold mb-4">No Books Yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Start building your book exchange by listing books you want to share.
            </p>
            <Button size="lg" asChild>
              <a href="/add">List Your First Book</a>
            </Button>
          </div>
        )}
        </div>
        </>
      )}
    </div>
  );
}
