import { OperationMetadata } from '@/lib/visualizationEngine';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit, Trash2, Star, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OperationHistoryProps {
  history: OperationMetadata[];
  onReplay: (operation: OperationMetadata) => void;
  onClear: () => void;
  onClose: () => void;
}

export function OperationHistory({ history, onReplay, onClear, onClose }: OperationHistoryProps) {
  const getIcon = (type: OperationMetadata['type']) => {
    switch (type) {
      case 'ADD': return <Plus className="h-4 w-4" />;
      case 'SEARCH': return <Search className="h-4 w-4" />;
      case 'UPDATE': return <Edit className="h-4 w-4" />;
      case 'DELETE': return <Trash2 className="h-4 w-4" />;
      case 'TOP_K': return <Star className="h-4 w-4" />;
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-80 border-l bg-card flex flex-col h-full"
    >
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Operation History</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {history.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="space-y-2">
            <div className="text-4xl">📝</div>
            <p className="text-sm text-muted-foreground">
              No operations yet.<br />
              Add or search movies to see history.
            </p>
          </div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              <AnimatePresence>
                {history.map((op, index) => (
                  <motion.div
                    key={`${op.timestamp}-${index}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onReplay(op)}
                    className="p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-primary/10 text-primary rounded">
                        {getIcon(op.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {op.movieName || op.type}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {op.eventsCount} events · {getTimeAgo(op.timestamp)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="w-full"
            >
              Clear History
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
}
