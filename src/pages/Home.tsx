import { useEffect, useState } from "react";
import { Movie } from "@/lib/dataStructures";
import { movieStore } from "@/lib/movieStore";
import { MovieCard } from "@/components/MovieCard";
import { Play, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-placeholder.jpg";

// Sample movies for demo - 6 popular Indian movies
const SAMPLE_DATA_VERSION = '2.0'; // Indian movies version
const sampleMovies: Movie[] = [
  { 
    id: "tt1187043", 
    name: "3 Idiots", 
    rating: 8.4, 
    year: 2009,
    posterUrl: "https://m.media-amazon.com/images/M/MV5BNTkyOGVjMGEtNmQzZi00NzFlLTlhOWQtODYyMDc2ZGJmYzFhXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg"
  },
  { 
    id: "tt5074352", 
    name: "Dangal", 
    rating: 8.3, 
    year: 2016,
    posterUrl: "https://m.media-amazon.com/images/M/MV5BMTQ4MzQzMzM2Nl5BMl5BanBnXkFtZTgwMTQ1NzU3MDI@._V1_SX300.jpg"
  },
  { 
    id: "tt2338151", 
    name: "PK", 
    rating: 8.1, 
    year: 2014,
    posterUrl: "https://m.media-amazon.com/images/M/MV5BMTYzOTE2NjkxN15BMl5BanBnXkFtZTgwMDgzMTg0MzE@._V1_SX300.jpg"
  },
  { 
    id: "tt4849438", 
    name: "Baahubali 2: The Conclusion", 
    rating: 8.2, 
    year: 2017,
    posterUrl: "https://m.media-amazon.com/images/M/MV5BY2VmYjZkOTItOWYzZC00NWEwLTliYzgtNDk0MjNmNTRlNzVjXkEyXkFqcGdeQXVyODE5NzE3OTE@._V1_SX300.jpg"
  },
  { 
    id: "tt0986264", 
    name: "Taare Zameen Par", 
    rating: 8.3, 
    year: 2007,
    posterUrl: "https://m.media-amazon.com/images/M/MV5BNTVkMTFiZWItOTI0Zi00ZjYwLTgyNzctMTE1NDdjMDgwMDgxXkEyXkFqcGdeQXVyODE5NzE3OTE@._V1_SX300.jpg"
  },
  { 
    id: "tt0169102", 
    name: "Lagaan", 
    rating: 8.1, 
    year: 2001,
    posterUrl: "https://m.media-amazon.com/images/M/MV5BNDYxNzQ5ZjItM2JlMi00MjlhLTk5NjAtMTRkZWVkOTg0NjcwXkEyXkFqcGdeQXVyNjQ2MjQ5NzM@._V1_SX300.jpg"
  },
];

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [hero, setHero] = useState<Movie | null>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    const loadMovies = async () => {
      console.log('Loading movies...');
      
      // Check version first
      const currentVersion = localStorage.getItem('movieDataVersion');
      const needsVersionUpdate = currentVersion !== SAMPLE_DATA_VERSION;
      
      if (needsVersionUpdate) {
        console.log(`Version mismatch (${currentVersion} -> ${SAMPLE_DATA_VERSION}). Clearing old data...`);
        movieStore.clearAll();
      } else {
        await movieStore.loadFromStorage();
      }
      
      let allMovies = movieStore.getAllMovies();
      console.log('Movies from storage:', allMovies.length);

      // Check if we need to load sample movies
      const needsSampleData = allMovies.length === 0 || needsVersionUpdate;

      console.log('Needs sample data?', needsSampleData);

      if (needsSampleData) {
        console.log('Loading 6 Indian sample movies...');
        // Load sample movies with poster URLs
        for (const movie of sampleMovies) {
          await movieStore.addMovie(movie);
        }
        allMovies = movieStore.getAllMovies();
        console.log('After loading samples:', allMovies.length);
        
        // Save version
        localStorage.setItem('movieDataVersion', SAMPLE_DATA_VERSION);
      }

      setMovies(allMovies);

      const top = await movieStore.topRated(10);
      setTopRated(top);
      console.log('Top rated movies:', top.length);

      if (top.length > 0) {
        setHero(top[0]);
        console.log('Hero set to:', top[0].name);
      }
    };

    loadMovies();
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
              {topRated.slice(0, 6).map((movie, index) => (
                <button
                  key={movie.id}
                  onClick={() => setCurrentHeroIndex(index)}
                  className={`transition-all ${
                    index === currentHeroIndex
                      ? 'w-12 h-1 bg-white'
                      : 'w-8 h-1 bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`View ${movie.name}`}
                />
              ))}
            </div>

            {/* Bottom content */}
            <div className="max-w-2xl">
              <div key={hero.id} className="space-y-4 animate-slide-up">
                <div className="flex items-center gap-2 text-sm">
                  <div className="px-2 py-1 bg-primary rounded">N</div>
                  <span className="text-muted-foreground">FEATURED</span>
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
