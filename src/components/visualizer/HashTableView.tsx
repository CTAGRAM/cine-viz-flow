import { VisualizationEvent, Movie } from '@/lib/dataStructures';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash } from 'lucide-react';

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

    // Set narration and highlights based on current event
    switch (lastEvent.type) {
      case 'hash-probe':
        setHighlightedBucket(lastEvent.bucket);
        setNarration(`Calculating hash for "${lastEvent.movieId}"...`);
        setHashCalculation({ movieId: lastEvent.movieId, bucket: lastEvent.bucket });
        break;
      case 'hash-chain-compare':
        setHighlightedBucket(lastEvent.bucket);
        setNarration(lastEvent.match ? `✓ Match found in bucket ${lastEvent.bucket}!` : `Comparing in chain...`);
        break;
      case 'hash-insert':
        setHighlightedBucket(lastEvent.bucket);
        setNarration(`✓ Inserted "${lastEvent.movieId}" into bucket ${lastEvent.bucket}`);
        break;
      case 'hash-update':
        setHighlightedBucket(lastEvent.bucket);
        setNarration(`✓ Updated "${lastEvent.movieId}" in bucket ${lastEvent.bucket}`);
        break;
      case 'hash-resize-start':
        setNarration(`⚠️ Resizing hash table: ${lastEvent.oldSize} → ${lastEvent.newSize} buckets`);
        break;
      case 'hash-rehash':
        setNarration(`Rehashing "${lastEvent.movieId}": bucket ${lastEvent.oldBucket} → ${lastEvent.newBucket}`);
        break;
      case 'hash-resize-complete':
        setNarration('✓ Resize complete!');
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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

      {/* Hash Calculation Display */}
      <AnimatePresence>
        {hashCalculation && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <div className="bg-card border-2 border-primary rounded-lg p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <Hash className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Hash Calculation</span>
              </div>
              <div className="space-y-2 font-mono text-sm">
                <div>Input: <span className="text-primary font-bold">{hashCalculation.movieId}</span></div>
                <div className="text-muted-foreground">hash(id) % {progressiveBuckets.length}</div>
                <div className="text-xl font-bold text-green-500">→ Bucket {hashCalculation.bucket}</div>
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
                borderColor: highlightedBucket === index ? 'hsl(var(--primary))' : 'hsl(var(--border))'
              }}
              className="border-2 rounded-lg bg-card overflow-hidden transition-all"
            >
              <div className={`px-3 py-2 text-sm font-semibold border-b flex items-center justify-between ${
                highlightedBucket === index ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <span>Bucket {index}</span>
                <span className="text-xs">{bucket.length}</span>
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
