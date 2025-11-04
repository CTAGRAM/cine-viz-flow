import { VisualizationEvent } from '@/lib/dataStructures';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface HashTableViewProps {
  events: VisualizationEvent[];
  buckets: any[][];
}

export function HashTableView({ events, buckets }: HashTableViewProps) {
  const [activeEvent, setActiveEvent] = useState<VisualizationEvent | null>(null);
  const [highlightedBucket, setHighlightedBucket] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (events.length === 0) return;
    
    const currentEvent = events[events.length - 1];
    setActiveEvent(currentEvent);

    // Reset highlights
    setHighlightedBucket(null);
    setHighlightedIndex(null);
    setIsResizing(false);

    // Apply highlights based on event
    if (currentEvent.type === 'hash-probe' || currentEvent.type === 'hash-insert' || currentEvent.type === 'hash-update') {
      setHighlightedBucket(currentEvent.bucket);
    } else if (currentEvent.type === 'hash-chain-compare') {
      setHighlightedBucket(currentEvent.bucket);
      setHighlightedIndex(currentEvent.index);
    } else if (currentEvent.type === 'hash-resize-start') {
      setIsResizing(true);
    }

    // Auto-clear highlights
    const timer = setTimeout(() => {
      setHighlightedBucket(null);
      setHighlightedIndex(null);
    }, 800);

    return () => clearTimeout(timer);
  }, [events]);

  const metrics = {
    items: buckets.reduce((sum, bucket) => sum + bucket.length, 0),
    capacity: buckets.length,
    loadFactor: buckets.reduce((sum, bucket) => sum + bucket.length, 0) / buckets.length,
    collisions: buckets.filter(b => b.length > 1).length
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-2 min-w-max">
          {buckets.map((bucket, bucketIndex) => (
            <div
              key={bucketIndex}
              className={cn(
                "flex flex-col items-center min-w-[120px] transition-all duration-300",
                highlightedBucket === bucketIndex && "scale-105"
              )}
            >
              {/* Bucket Header */}
              <div
                className={cn(
                  "w-full text-center py-2 px-3 rounded-t-lg border-b-2 font-mono text-sm font-semibold transition-all duration-300",
                  highlightedBucket === bucketIndex
                    ? "bg-primary text-primary-foreground border-primary animate-pulse-glow"
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                [{bucketIndex}]
              </div>

              {/* Chain */}
              <div className="w-full bg-card border border-t-0 rounded-b-lg p-2 min-h-[100px] space-y-2">
                {bucket.length === 0 ? (
                  <div className="text-muted-foreground text-xs text-center py-4">Empty</div>
                ) : (
                  bucket.map((movie, index) => (
                    <div
                      key={`${movie.id}-${index}`}
                      className={cn(
                        "p-2 rounded-lg border text-xs font-mono transition-all duration-300",
                        highlightedBucket === bucketIndex && highlightedIndex === index
                          ? activeEvent?.type === 'hash-chain-compare' && 'match' in activeEvent && activeEvent.match
                            ? "bg-green-500/20 border-green-500 animate-bounce"
                            : "bg-red-500/20 border-red-500"
                          : "bg-muted border-border hover:border-primary"
                      )}
                    >
                      <div className="font-semibold truncate">{movie.id}</div>
                      <div className="text-muted-foreground truncate text-[10px]">{movie.name}</div>
                      <div className="text-primary font-bold">★ {movie.rating}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Footer */}
      <div className="border-t bg-muted/50 p-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{metrics.items}</div>
            <div className="text-xs text-muted-foreground">Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{metrics.capacity}</div>
            <div className="text-xs text-muted-foreground">Capacity</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{metrics.loadFactor.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Load Factor</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{metrics.collisions}</div>
            <div className="text-xs text-muted-foreground">Collisions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
