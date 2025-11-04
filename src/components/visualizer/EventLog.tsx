import { VisualizationEvent } from '@/lib/dataStructures';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface EventLogProps {
  events: VisualizationEvent[];
  currentIndex: number;
  onEventClick: (index: number) => void;
}

export function EventLog({ events, currentIndex, onEventClick }: EventLogProps) {
  const formatEvent = (event: VisualizationEvent): string => {
    switch (event.type) {
      case 'hash-probe':
        return `Hash probe bucket ${event.bucket} for ${event.movieId}`;
      case 'hash-chain-compare':
        return `Compare at bucket ${event.bucket}[${event.index}] - ${event.match ? 'Match!' : 'No match'}`;
      case 'hash-insert':
        return `Insert ${event.movieId} into bucket ${event.bucket}`;
      case 'hash-update':
        return `Update ${event.movieId} in bucket ${event.bucket}`;
      case 'hash-resize-start':
        return `Resize: ${event.oldSize} → ${event.newSize}`;
      case 'hash-rehash':
        return `Rehash ${event.movieId}: bucket ${event.oldBucket} → ${event.newBucket}`;
      case 'hash-resize-complete':
        return `Resize complete`;
      case 'avl-visit':
        return `Visit node ${event.nodeId} (rating: ${event.rating}) - ${event.purpose}`;
      case 'avl-insert':
        return `Insert node ${event.nodeId} (rating: ${event.rating})`;
      case 'avl-delete':
        return `Delete node ${event.nodeId} (rating: ${event.rating})`;
      case 'avl-rotate':
        return `${event.rotationType} rotation at ${event.pivotId}`;
      case 'avl-update-metrics':
        return `Update metrics: ${event.nodeId} (h:${event.height}, b:${event.balance}, s:${event.size})`;
      case 'avl-rank':
        return `Rank #${event.rank}: ${event.nodeId}`;
      default:
        return 'Unknown event';
    }
  };

  return (
    <div className="border-t bg-card h-48">
      <div className="p-4 border-b bg-muted/50">
        <h3 className="font-semibold text-sm">Event Log</h3>
      </div>
      <ScrollArea className="h-[calc(100%-3rem)]">
        <div className="p-2 space-y-1">
          {events.map((event, index) => (
            <div
              key={index}
              onClick={() => onEventClick(index)}
              className={cn(
                "p-2 rounded text-xs font-mono cursor-pointer transition-colors",
                index === currentIndex
                  ? "bg-primary text-primary-foreground"
                  : index < currentIndex
                  ? "bg-muted text-muted-foreground hover:bg-muted/80"
                  : "text-muted-foreground/50 hover:bg-muted/50"
              )}
            >
              <span className="text-[10px] opacity-70 mr-2">#{index + 1}</span>
              {formatEvent(event)}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
