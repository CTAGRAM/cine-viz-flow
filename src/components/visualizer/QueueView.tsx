import { useEffect, useState } from 'react';
import { QueueVisualizationEvent } from '@/lib/queueDataStructure';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface QueueViewProps {
  events: QueueVisualizationEvent[];
  queueItems: any[];
}

export const QueueView = ({ events, queueItems }: QueueViewProps) => {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [narration, setNarration] = useState('');
  const [highlightType, setHighlightType] = useState<'front' | 'rear' | null>(null);

  useEffect(() => {
    if (events.length === 0) return;

    const lastEvent = events[events.length - 1];

    switch (lastEvent.type) {
      case 'enqueue':
        setHighlightedIndex(lastEvent.position);
        setHighlightType('rear');
        setNarration(`Enqueued item at position ${lastEvent.position}`);
        break;
      case 'dequeue':
        setHighlightedIndex(0);
        setHighlightType('front');
        setNarration('Dequeued item from front of queue');
        break;
      case 'peek':
        setHighlightedIndex(0);
        setHighlightType('front');
        setNarration('Peeking at front item');
        break;
      case 'empty_check':
        setNarration(lastEvent.isEmpty ? 'Queue is empty' : 'Queue is not empty');
        setHighlightedIndex(null);
        break;
      case 'size_check':
        setNarration(`Queue size: ${lastEvent.size}`);
        break;
      case 'highlight_front':
        setHighlightType('front');
        setNarration(lastEvent.reason);
        setHighlightedIndex(0);
        break;
      case 'highlight_rear':
        setHighlightType('rear');
        setNarration(lastEvent.reason);
        setHighlightedIndex(queueItems.length - 1);
        break;
    }

    const timeout = setTimeout(() => {
      setHighlightedIndex(null);
      setHighlightType(null);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [events, queueItems.length]);

  if (queueItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            Queue is empty. Perform operations to see the queue visualization.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6">
      {/* Narration */}
      {narration && (
        <div className="bg-accent/50 p-4 rounded-lg mb-6 animate-fade-in">
          <p className="text-sm font-medium">{narration}</p>
        </div>
      )}

      {/* Queue Explanation */}
      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Request Queue (FIFO)</h3>
        <p className="text-sm text-muted-foreground">
          First In, First Out - Requests are processed in the order they arrive.
          New requests are added to the rear, and processing happens from the front.
        </p>
      </div>

      {/* Queue Labels */}
      <div className="flex justify-between mb-2 px-4">
        <Badge variant={highlightType === 'front' ? 'default' : 'outline'}>
          Front (Dequeue)
        </Badge>
        <Badge variant={highlightType === 'rear' ? 'default' : 'outline'}>
          Rear (Enqueue)
        </Badge>
      </div>

      {/* Queue Visualization */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4">
        {queueItems.map((item, index) => {
          const isHighlighted = highlightedIndex === index;
          const isFront = index === 0;
          const isRear = index === queueItems.length - 1;

          return (
            <div key={item.id || index} className="flex items-center">
              <Card
                className={`
                  p-4 min-w-[150px] transition-all duration-300
                  ${isHighlighted ? 'ring-2 ring-primary scale-105 animate-pulse' : ''}
                  ${isFront ? 'border-success' : ''}
                  ${isRear ? 'border-warning' : ''}
                `}
              >
                <div className="flex flex-col gap-2">
                  {isFront && (
                    <Badge variant="outline" className="text-xs">
                      Front
                    </Badge>
                  )}
                  {isRear && (
                    <Badge variant="outline" className="text-xs">
                      Rear
                    </Badge>
                  )}
                  
                  <div className="font-mono text-xs text-muted-foreground">
                    Position: {index}
                  </div>
                  
                  {item.data?.requester_name && (
                    <div className="font-medium text-sm">
                      {item.data.requester_name}
                    </div>
                  )}
                  
                  {item.data?.book_title && (
                    <div className="text-xs text-muted-foreground truncate max-w-[130px]">
                      {item.data.book_title}
                    </div>
                  )}
                  
                  {item.priority !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      Priority: {item.priority}
                    </Badge>
                  )}
                  
                  {item.timestamp && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </Card>
              
              {index < queueItems.length - 1 && (
                <ArrowRight className="h-6 w-6 text-muted-foreground mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Queue Operations Explanation */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-2">Enqueue (Add)</h4>
          <p className="text-xs text-muted-foreground">
            Add new request to the rear of the queue
          </p>
          <Badge variant="outline" className="mt-2">O(1)</Badge>
        </Card>
        
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-2">Dequeue (Remove)</h4>
          <p className="text-xs text-muted-foreground">
            Remove and process request from the front
          </p>
          <Badge variant="outline" className="mt-2">O(1)</Badge>
        </Card>
        
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-2">Peek (View)</h4>
          <p className="text-xs text-muted-foreground">
            View front request without removing it
          </p>
          <Badge variant="outline" className="mt-2">O(1)</Badge>
        </Card>
      </div>

      {/* Statistics */}
      <div className="flex gap-4 mt-6 p-4 bg-muted rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold">{queueItems.length}</div>
          <div className="text-xs text-muted-foreground">Queue Size</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {events.filter(e => e.type === 'enqueue').length}
          </div>
          <div className="text-xs text-muted-foreground">Total Enqueued</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {events.filter(e => e.type === 'dequeue').length}
          </div>
          <div className="text-xs text-muted-foreground">Total Dequeued</div>
        </div>
      </div>
    </div>
  );
};
