import { useEffect, useState } from "react";
import { Book } from "@/lib/dataStructures";
import { bookStore } from "@/lib/bookStore";
import { BookCard } from "@/components/BookCard";
import { BookOpen, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-placeholder.jpg";
import effectiveJava from "@/assets/books/effective-java.jpg";
import introAlgorithms from "@/assets/books/intro-algorithms.jpg";
import cleanCode from "@/assets/books/clean-code.jpg";
import linearAlgebra from "@/assets/books/linear-algebra.jpg";
import physicsSerway from "@/assets/books/physics-serway.jpg";
import thomasCalculus from "@/assets/books/thomas-calculus.jpg";

// Sample books for demo - diverse academic books
const SAMPLE_DATA_VERSION = '3.0'; // Book exchange version
const sampleBooks: Book[] = [
  { 
    id: "isbn-978-0134685991", 
    name: "Effective Java", 
    rating: 9.2,
    author: "Joshua Bloch",
    subject: "Computer Science",
    condition: "Good",
    year: 2018,
    posterUrl: effectiveJava,
    owner: "Student A",
    available: true
  },
  { 
    id: "isbn-978-0262033848", 
    name: "Introduction to Algorithms", 
    rating: 9.5,
    author: "Cormen, Leiserson, Rivest, Stein",
    subject: "Computer Science",
    condition: "New",
    year: 2009,
    posterUrl: introAlgorithms,
    owner: "Student B",
    available: true
  },
  { 
    id: "isbn-978-0132350884", 
    name: "Clean Code", 
    rating: 8.9,
    author: "Robert C. Martin",
    subject: "Computer Science",
    condition: "Good",
    year: 2008,
    posterUrl: cleanCode,
    owner: "Student C",
    available: true
  },
  { 
    id: "isbn-978-0073383095", 
    name: "Linear Algebra and Its Applications", 
    rating: 8.7,
    author: "David C. Lay",
    subject: "Mathematics",
    condition: "Fair",
    year: 2015,
    posterUrl: linearAlgebra,
    owner: "Student D",
    available: true
  },
  { 
    id: "isbn-978-1292024448", 
    name: "Physics for Scientists and Engineers", 
    rating: 9.1,
    author: "Raymond A. Serway",
    subject: "Physics",
    condition: "Good",
    year: 2014,
    posterUrl: physicsSerway,
    owner: "Student E",
    available: false
  },
  { 
    id: "isbn-978-0321570567", 
    name: "Thomas' Calculus", 
    rating: 8.8,
    author: "George B. Thomas",
    subject: "Mathematics",
    condition: "Good",
    year: 2013,
    posterUrl: thomasCalculus,
    owner: "Student F",
    available: true
  },
];

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [topRated, setTopRated] = useState<Book[]>([]);
  const [hero, setHero] = useState<Book | null>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    const loadBooks = async () => {
      console.log('Loading books...');
      
      // Check version first
      const currentVersion = localStorage.getItem('bookDataVersion');
      const needsVersionUpdate = currentVersion !== SAMPLE_DATA_VERSION;
      
      if (needsVersionUpdate) {
        console.log(`Version mismatch (${currentVersion} -> ${SAMPLE_DATA_VERSION}). Clearing old data...`);
        bookStore.clearAll();
      } else {
        await bookStore.loadFromStorage();
      }
      
      let allBooks = bookStore.getAllBooks();
      console.log('Books from storage:', allBooks.length);

      // Check if we need to load sample books
      const needsSampleData = allBooks.length === 0 || needsVersionUpdate;

      console.log('Needs sample data?', needsSampleData);

      if (needsSampleData) {
        console.log('Loading sample books...');
        // Load sample books
        for (const book of sampleBooks) {
          await bookStore.addBook(book);
        }
        allBooks = bookStore.getAllBooks();
        console.log('After loading samples:', allBooks.length);
        
        // Save version
        localStorage.setItem('bookDataVersion', SAMPLE_DATA_VERSION);
      }

      setBooks(allBooks);

      const top = await bookStore.topRated(10);
      setTopRated(top);
      console.log('Top rated books:', top.length);

      if (top.length > 0) {
        setHero(top[0]);
        console.log('Hero set to:', top[0].name);
      }
    };

    loadBooks();
  }, []);

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
                {topRated.map((book) => (
                  <div key={book.id} className="flex-none w-48 snap-start">
                    <BookCard book={book} />
                  </div>
                ))}
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
                {books.slice(0, 12).reverse().map((book) => (
                  <div key={book.id} className="flex-none w-48 snap-start">
                    <BookCard book={book} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Movies */}
        {books.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Browse All</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {books.slice(0, 18).map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
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
    </div>
  );
}
