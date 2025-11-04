import { useEffect, useState } from "react";
import { Movie } from "@/lib/dataStructures";
import { movieStore } from "@/lib/movieStore";
import { MovieCard } from "@/components/MovieCard";
import { Play, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-placeholder.jpg";

// Sample movies for demo
const sampleMovies: Movie[] = [
  { id: "tt0111161", name: "The Shawshank Redemption", rating: 9.3, year: 1994 },
  { id: "tt0068646", name: "The Godfather", rating: 9.2, year: 1972 },
  { id: "tt0468569", name: "The Dark Knight", rating: 9.0, year: 2008 },
  { id: "tt0071562", name: "The Godfather Part II", rating: 9.0, year: 1974 },
  { id: "tt0050083", name: "12 Angry Men", rating: 9.0, year: 1957 },
  { id: "tt0108052", name: "Schindler's List", rating: 8.9, year: 1993 },
  { id: "tt0167260", name: "The Lord of the Rings: Return of the King", rating: 8.9, year: 2003 },
  { id: "tt0110912", name: "Pulp Fiction", rating: 8.8, year: 1994 },
  { id: "tt0060196", name: "The Good, the Bad and the Ugly", rating: 8.8, year: 1966 },
  { id: "tt0120737", name: "The Lord of the Rings: Fellowship of the Ring", rating: 8.8, year: 2001 },
  { id: "tt0109830", name: "Forrest Gump", rating: 8.8, year: 1994 },
  { id: "tt0137523", name: "Fight Club", rating: 8.7, year: 1999 },
];

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [hero, setHero] = useState<Movie | null>(null);

  useEffect(() => {
    const loadMovies = async () => {
      await movieStore.loadFromStorage();
      let allMovies = movieStore.getAllMovies();

      // Load sample movies if empty
      if (allMovies.length === 0) {
        for (const movie of sampleMovies) {
          await movieStore.addMovie(movie);
        }
        allMovies = movieStore.getAllMovies();
      }

      setMovies(allMovies);

      const top = await movieStore.topRated(10);
      setTopRated(top);

      if (top.length > 0) {
        setHero(top[0]);
      }
    };

    loadMovies();
  }, []);

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
          {/* Background */}
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt={hero.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-end px-16 pb-24 max-w-2xl">
            <div className="space-y-4 animate-slide-up">
              <div className="flex items-center gap-2 text-sm">
                <div className="px-2 py-1 bg-primary rounded">N</div>
                <span className="text-muted-foreground">SERIES</span>
              </div>

              <h1 className="text-6xl font-bold tracking-tight">{hero.name}</h1>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-yellow-500 text-black rounded font-bold">
                    IMDb
                  </div>
                  <span className="font-semibold">{hero.rating}/10</span>
                </div>
                {hero.year && (
                  <span className="text-muted-foreground">{hero.year}</span>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                  <Play className="w-5 h-5 fill-current" />
                  Play
                </Button>
                <Button size="lg" variant="secondary" className="gap-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm">
                  <Info className="w-5 h-5" />
                  More Info
                </Button>
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
              <h2 className="text-2xl font-bold">Top Rated on IMDb</h2>
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
                {topRated.map((movie) => (
                  <div key={movie.id} className="flex-none w-48 snap-start">
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recently Added */}
        {movies.length > 0 && (
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
                {movies.slice(0, 12).reverse().map((movie) => (
                  <div key={movie.id} className="flex-none w-48 snap-start">
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Movies */}
        {movies.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Browse All</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {movies.slice(0, 18).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {movies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-3xl font-bold mb-4">No Movies Yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Start building your collection by adding movies to your catalog.
            </p>
            <Button size="lg" asChild>
              <a href="/add">Add Your First Movie</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
