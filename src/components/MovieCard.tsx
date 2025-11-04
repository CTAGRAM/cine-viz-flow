import { Movie } from "@/lib/dataStructures";
import { Play, Info, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  movie: Movie;
  onDetails?: () => void;
  className?: string;
}

export const MovieCard = ({ movie, onDetails, className }: MovieCardProps) => {
  return (
    <div
      className={cn(
        "group relative aspect-[2/3] rounded-md overflow-hidden bg-muted cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-2xl",
        className
      )}
      onClick={onDetails}
    >
      {movie.posterUrl ? (
        <img
          src={movie.posterUrl}
          alt={movie.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
          <span className="text-4xl font-bold text-muted-foreground/30">
            {movie.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2">{movie.name}</h3>
          
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-primary/90 rounded text-xs font-bold">
              ⭐ {movie.rating.toFixed(1)}
            </div>
            {movie.year && (
              <div className="text-xs text-muted-foreground">{movie.year}</div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white/90 hover:bg-white text-black rounded-md text-sm font-semibold transition-colors"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Play className="w-4 h-4" />
              Play
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDetails?.();
              }}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
