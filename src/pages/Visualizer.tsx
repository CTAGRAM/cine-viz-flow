import { useEffect, useState } from 'react';
import { bookStore as movieStore } from '@/lib/bookStore';
import { visualizationEngine } from '@/lib/visualizationEngine';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { HashTableView } from '@/components/visualizer/HashTableView';
import { AVLTreeView } from '@/components/visualizer/AVLTreeView';
import { GraphView } from '@/components/visualizer/GraphView';
import { TrieView } from '@/components/visualizer/TrieView';
import { QueueView } from '@/components/visualizer/QueueView';
import { EventPlayer } from '@/components/visualizer/EventPlayer';
import { OperationBanner } from '@/components/visualizer/OperationBanner';
import { OperationHistory } from '@/components/visualizer/OperationHistory';
import { History, Plus, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useVisualizationSync } from '@/hooks/useVisualizationSync';
import { bookExchangeGraph } from '@/lib/graphDataStructure';
import { requestQueue } from '@/lib/queueDataStructure';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function Visualizer() {
  const navigate = useNavigate();
  const [playbackState, setPlaybackState] = useState(visualizationEngine.getState());
  const [hashBuckets, setHashBuckets] = useState(movieStore.getHashTable().getBuckets());
  const [avlRoot, setAvlRoot] = useState(movieStore.getAVLTree().getRoot());
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(visualizationEngine.getHistory());
  const [graphNodes, setGraphNodes] = useState(bookExchangeGraph.getNodes());
  const [graphEdges, setGraphEdges] = useState(bookExchangeGraph.getEdges());
  const [queueItems, setQueueItems] = useState(requestQueue.getItems());
  const [recentOperations, setRecentOperations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Enable real-time sync
  useVisualizationSync();

  // Load last operation on mount
  useEffect(() => {
    const loadLastOperation = async () => {
      try {
        const { data, error } = await supabase
          .from('visualization_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (data && data.length > 0) {
          setRecentOperations(data);
          
          // Auto-load the most recent operation
          const lastOp = data[0];
          const events = Array.isArray(lastOp.events) ? lastOp.events : [];
          const metadata = (lastOp.metadata as Record<string, any>) || {};
          const operation = {
            type: lastOp.operation_type as any,
            timestamp: new Date(lastOp.created_at).getTime(),
            eventsCount: events.length,
            ...metadata
          };
          
          visualizationEngine.setEvents(events as any, operation);
          visualizationEngine.play();
        }
      } catch (error) {
        console.error('Error loading last operation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLastOperation();
  }, []);

  useEffect(() => {
    // Subscribe to visualization events
    const unsubscribe = visualizationEngine.subscribe(setPlaybackState);

    // Subscribe to movie store events
    movieStore.onEvents((events, operation) => {
      visualizationEngine.setEvents(events, operation);
      visualizationEngine.play();
      
      // Update all data structures
      setHashBuckets([...movieStore.getHashTable().getBuckets()]);
      setAvlRoot(movieStore.getAVLTree().getRoot());
      setGraphNodes(bookExchangeGraph.getNodes());
      setGraphEdges(bookExchangeGraph.getEdges());
      setQueueItems(requestQueue.getItems());
      setHistory(visualizationEngine.getHistory());
    });

    return unsubscribe;
  }, []);

  const handleReplay = (operation: any) => {
    // Can't truly replay without re-executing, but we can show it was selected
    setShowHistory(false);
  };

  const loadOperation = (opId: string) => {
    const op = recentOperations.find(o => o.id === opId);
    if (op) {
      const events = Array.isArray(op.events) ? op.events : [];
      const metadata = (op.metadata as Record<string, any>) || {};
      const operation = {
        type: op.operation_type as any,
        timestamp: new Date(op.created_at).getTime(),
        eventsCount: events.length,
        ...metadata
      };
      
      visualizationEngine.setEvents(events as any, operation);
      visualizationEngine.play();
    }
  };

  const eventsUpToCurrent = visualizationEngine.getEventsUpToCurrent();

  return (
    <div className="h-screen flex bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Data Structure Visualizer</h1>
            <p className="text-sm text-muted-foreground">
              Watch data structures in action - Real-time step-by-step animations
            </p>
          </div>
          <div className="flex gap-2">
            {recentOperations.length > 0 && (
              <Select onValueChange={loadOperation}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Load recent operation..." />
                </SelectTrigger>
                <SelectContent>
                  {recentOperations.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {op.operation_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(op.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/add')}
            >
              <Plus className="h-4 w-4 mr-2" />
              List Book
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>
        </div>


        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="hash" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-muted/50">
            <TabsTrigger value="hash">Hash Table</TabsTrigger>
            <TabsTrigger value="avl">AVL Tree</TabsTrigger>
            <TabsTrigger value="graph">Matching Graph</TabsTrigger>
            <TabsTrigger value="trie">Trie Search</TabsTrigger>
            <TabsTrigger value="queue">Request Queue</TabsTrigger>
            <TabsTrigger value="split">Split View</TabsTrigger>
          </TabsList>

          <TabsContent value="hash" className="flex-1 m-0 overflow-hidden">
            <HashTableView
              events={eventsUpToCurrent}
              buckets={hashBuckets}
            />
          </TabsContent>

          <TabsContent value="avl" className="flex-1 m-0 overflow-hidden">
            <AVLTreeView
              events={eventsUpToCurrent}
              root={avlRoot}
            />
          </TabsContent>

          <TabsContent value="graph" className="flex-1 m-0 overflow-auto">
            {graphNodes.length === 0 ? (
              <div className="flex items-center justify-center h-full p-8">
                <div className="text-center space-y-4 max-w-2xl">
                  <div className="text-6xl">🕸️</div>
                  <h3 className="text-xl font-semibold">No Graph Data Yet</h3>
                  <p className="text-muted-foreground">
                    The matching graph visualizes relationships between students and books using BFS traversal.
                    Go to the <strong>Matches</strong> page to see graph-based matching in action!
                  </p>
                  <div className="bg-card border rounded-lg p-4 text-left space-y-2 text-sm">
                    <p className="font-semibold">How it works:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <strong>Student nodes</strong> (circular) represent users</li>
                      <li>• <strong>Book nodes</strong> (rectangular) represent books</li>
                      <li>• <strong>"owns" edges</strong> connect students to their books</li>
                      <li>• <strong>"wants" edges</strong> show interest in books</li>
                      <li>• <strong>BFS traversal</strong> finds exchange paths</li>
                    </ul>
                  </div>
                  <Button onClick={() => navigate('/matches')}>
                    View Matches
                  </Button>
                </div>
              </div>
            ) : (
              <GraphView
                events={eventsUpToCurrent}
                nodes={graphNodes}
                edges={graphEdges}
              />
            )}
          </TabsContent>

          <TabsContent value="trie" className="flex-1 m-0 overflow-auto">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border-b">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Trie Search:</strong> Visualizes character-by-character prefix matching for autocomplete. 
                Try searching on the <strong>Search</strong> page to see this in action!
              </p>
            </div>
            <TrieView events={eventsUpToCurrent} />
          </TabsContent>

          <TabsContent value="queue" className="flex-1 m-0 overflow-auto">
            <div className="p-4 bg-purple-50 dark:bg-purple-950 border-b">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>Request Queue:</strong> Shows FIFO (First-In-First-Out) queue operations for book requests. 
                Visit the <strong>Requests</strong> page to see enqueue/dequeue operations!
              </p>
            </div>
            <QueueView
              events={eventsUpToCurrent}
              queueItems={queueItems}
            />
          </TabsContent>

          <TabsContent value="split" className="flex-1 m-0 grid grid-cols-2 gap-4 p-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 border-b">
                <h3 className="font-semibold text-sm">Hash Table</h3>
              </div>
              <HashTableView
                events={eventsUpToCurrent}
                buckets={hashBuckets}
              />
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 border-b">
                <h3 className="font-semibold text-sm">AVL Tree</h3>
              </div>
              <AVLTreeView
                events={eventsUpToCurrent}
                root={avlRoot}
              />
            </div>
          </TabsContent>
          </Tabs>

          {/* Event Player */}
          {playbackState.events.length > 0 && (
            <EventPlayer
              state={playbackState}
              onPlay={() => visualizationEngine.play()}
              onPause={() => visualizationEngine.pause()}
              onStepForward={() => visualizationEngine.stepForward()}
              onStepBackward={() => visualizationEngine.stepBackward()}
              onSpeedChange={(speed) => visualizationEngine.setSpeed(speed)}
              onJumpTo={(index) => visualizationEngine.jumpTo(index)}
            />
          )}

          {/* Empty State */}
          {playbackState.events.length === 0 && !isLoading && (
            <div className="flex-1 flex items-center justify-center p-12 text-center overflow-auto">
              <div className="space-y-6 max-w-3xl">
                <div className="text-6xl">📚</div>
                <h3 className="text-2xl font-semibold">Ready to Visualize Data Structures!</h3>
                <p className="text-muted-foreground">
                  Perform operations to see beautiful step-by-step animations of algorithms in action
                </p>
                
                {/* Quick Guide */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="bg-card border rounded-lg p-4 space-y-2">
                    <div className="text-2xl">📊</div>
                    <h4 className="font-semibold">Hash Table & AVL Tree</h4>
                    <p className="text-sm text-muted-foreground">
                      Add or search books to see hash table lookups and AVL tree balancing
                    </p>
                  </div>
                  
                  <div className="bg-card border rounded-lg p-4 space-y-2">
                    <div className="text-2xl">🔍</div>
                    <h4 className="font-semibold">Trie Search</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the search page to visualize prefix-based autocomplete
                    </p>
                  </div>
                  
                  <div className="bg-card border rounded-lg p-4 space-y-2">
                    <div className="text-2xl">🕸️</div>
                    <h4 className="font-semibold">Matching Graph</h4>
                    <p className="text-sm text-muted-foreground">
                      View matches to see BFS graph traversal for book exchanges
                    </p>
                  </div>
                  
                  <div className="bg-card border rounded-lg p-4 space-y-2">
                    <div className="text-2xl">📋</div>
                    <h4 className="font-semibold">Request Queue</h4>
                    <p className="text-sm text-muted-foreground">
                      Accept/reject requests to see FIFO queue operations
                    </p>
                  </div>
                </div>
                
                <Button onClick={() => navigate('/add')} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  List Your First Book
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <OperationHistory
            history={history}
            onReplay={handleReplay}
            onClear={() => {
              visualizationEngine.clearHistory();
              setHistory([]);
            }}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
