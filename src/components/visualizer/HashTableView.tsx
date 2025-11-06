import { VisualizationEvent, Movie } from '@/lib/dataStructures';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, ArrowRight, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HashTableViewProps {
  events: VisualizationEvent[];
  buckets: Movie[][];
}

export function HashTableView({ events, buckets }: HashTableViewProps) {
  const [activeEvent, setActiveEvent] = useState<VisualizationEvent | null>(null);
  const [highlightedBucket, setHighlightedBucket] = useState<number | null>(null);
  const [narration, setNarration] = useState<string>('');
  const [hashCalculation, setHashCalculation] = useState<{ movieId: string; bucket: number } | null>(null);

  // Rebuild state progressively based on events
  const [progressiveBuckets, setProgressiveBuckets] = useState<Movie[][]>([]);

  useEffect(() => {
    if (events.length === 0) return;

    const lastEvent = events[events.length - 1];
    setActiveEvent(lastEvent);

    // Build up the hash table state progressively
    const tempBuckets: Movie[][] = Array.from({ length: buckets.length }, () => []);
    
    events.forEach(event => {
      if (event.type === 'hash-insert') {
        const movie = buckets[event.bucket]?.find(m => m.id === event.movieId);
        if (movie && !tempBuckets[event.bucket].find(m => m.id === movie.id)) {
          tempBuckets[event.bucket].push(movie);
        }
      } else if (event.type === 'hash-update') {
        const movie = buckets[event.bucket]?.find(m => m.id === event.movieId);
        if (movie) {
          const index = tempBuckets[event.bucket].findIndex(m => m.id === movie.id);
          if (index >= 0) {
            tempBuckets[event.bucket][index] = movie;
          }
        }
      }
    });

    setProgressiveBuckets(tempBuckets);

    // Set narration and highlights based on current event (plain English)
    switch (lastEvent.type) {
        case 'hash-probe':
        setHighlightedBucket(lastEvent.bucket);
        setNarration(`Finding the right box for this book...`);
        setHashCalculation({ movieId: lastEvent.movieId, bucket: lastEvent.bucket });
        break;
      case 'hash-chain-compare':
        setHighlightedBucket(lastEvent.bucket);
        setNarration(lastEvent.match ? `✓ Found it in Box ${lastEvent.bucket}!` : `Checking books in this box...`);
        break;
      case 'hash-insert':
        setHighlightedBucket(lastEvent.bucket);
        setNarration(`✓ Book saved in Box ${lastEvent.bucket}`);
        break;
      case 'hash-update':
        setHighlightedBucket(lastEvent.bucket);
        setNarration(`✓ Book updated in Box ${lastEvent.bucket}`);
        break;
      case 'hash-resize-start':
        setNarration(`📦 Growing storage: ${lastEvent.oldSize} → ${lastEvent.newSize} boxes`);
        break;
      case 'hash-rehash':
        setNarration(`Moving book: Box ${lastEvent.oldBucket} → Box ${lastEvent.newBucket}`);
        break;
      case 'hash-resize-complete':
        setNarration('✓ Storage expanded successfully!');
        break;
      default:
        setNarration('');
    }

    const timer = setTimeout(() => {
      setHighlightedBucket(null);
      setHashCalculation(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [events, buckets]);

  const totalItems = progressiveBuckets.reduce((sum, bucket) => sum + bucket.length, 0);
  const loadFactor = (totalItems / progressiveBuckets.length).toFixed(2);
  const collisions = progressiveBuckets.filter(b => b.length > 1).length;

  const getBucketColor = (bucket: Movie[]) => {
    if (bucket.length === 0) return 'border-muted bg-muted/30';
    if (bucket.length === 1) return 'border-green-500/50 bg-green-500/5';
    return 'border-yellow-500/50 bg-yellow-500/5';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Help Banner */}
      <div className="bg-muted/50 px-6 py-2 text-sm text-muted-foreground border-b flex items-center justify-center gap-2">
        <Info className="h-4 w-4" />
        Books are distributed across boxes using a hash function for fast lookups
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-primary cursor-help underline">Learn more</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">The box number is calculated from the book ID, not sequential. This ensures even distribution and quick searches.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Narration */}
      <AnimatePresence mode="wait">
        {narration && (
          <motion.div
            key={narration}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-primary/10 text-primary px-6 py-3 text-center font-medium border-b"
          >
            {narration}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hash Calculation Display - Visual Flow */}
      <AnimatePresence>
        {hashCalculation && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <div className="bg-card border-2 border-primary rounded-lg p-8 shadow-2xl max-w-xl">
              <div className="flex items-center gap-3 mb-6">
                <Hash className="h-7 w-7 text-primary" />
                <span className="font-bold text-xl">How it works</span>
              </div>
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded font-bold">Step 1</div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Book ID</div>
                    <div className="font-mono font-bold">{hashCalculation.movieId}</div>
                  </div>
                </div>
                
                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-primary animate-pulse" />
                </div>
                
                {/* Step 2 */}
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded font-bold">Step 2</div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Hash Function calculates</div>
                    <div className="font-mono text-sm">hash(id) % {progressiveBuckets.length}</div>
                  </div>
                </div>
                
                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-primary animate-pulse" />
                </div>
                
                {/* Step 3 */}
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded font-bold">Step 3</div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Stored in</div>
                    <div className="text-2xl font-bold text-green-500">Box {hashCalculation.bucket}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buckets Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-4 gap-4">
          {progressiveBuckets.map((bucket, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: highlightedBucket === index ? 1.05 : 1,
              }}
              className={`border-2 rounded-lg overflow-hidden transition-all ${getBucketColor(bucket)} ${
                highlightedBucket === index ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
            >
              <div className={`px-3 py-2 text-sm font-semibold border-b flex items-center justify-between ${
                highlightedBucket === index ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <span className="flex items-center gap-1">
                  📦 Box {index}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  bucket.length === 0 ? 'bg-muted-foreground/20' : 
                  bucket.length === 1 ? 'bg-green-500 text-white' : 
                  'bg-yellow-500 text-black'
                }`}>
                  {bucket.length}
                </span>
              </div>
              
              <div className="p-2 space-y-2 min-h-[100px]">
                <AnimatePresence>
                  {bucket.map((movie, movieIndex) => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: movieIndex * 0.1 }}
                      className="bg-background border rounded p-2"
                    >
                      <div className="flex gap-2">
                        {movie.posterUrl && (
                          <img 
                            src={movie.posterUrl} 
                            alt={movie.name}
                            className="w-10 h-14 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs truncate">{movie.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{movie.id}</div>
                          <div className="text-xs font-bold text-yellow-500">⭐ {movie.rating}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Metrics Footer */}
      <div className="border-t bg-muted/50 px-6 py-3 flex items-center justify-around text-sm">
        <div>
          <span className="text-muted-foreground">Items:</span>
          <span className="ml-2 font-bold">{totalItems}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Capacity:</span>
          <span className="ml-2 font-bold">{progressiveBuckets.length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Load Factor:</span>
          <span className="ml-2 font-bold">{loadFactor}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Collisions:</span>
          <span className="ml-2 font-bold text-red-500">{collisions}</span>
        </div>
      </div>
    </div>
  );
}
