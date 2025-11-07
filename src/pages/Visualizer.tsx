import { useEffect, useState } from 'react';
import { bookStore as movieStore } from '@/lib/bookStore';
import { visualizationEngine } from '@/lib/visualizationEngine';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { HashTableView } from '@/components/visualizer/HashTableView';
import { AVLTreeView } from '@/components/visualizer/AVLTreeView';
import { GraphView } from '@/components/visualizer/GraphView';
import { TrieView } from '@/components/visualizer/TrieView';
import { QueueView } from '@/components/visualizer/QueueView';
import { EventPlayer } from '@/components/visualizer/EventPlayer';
import { OperationBanner } from '@/components/visualizer/OperationBanner';
import { OperationHistory } from '@/components/visualizer/OperationHistory';
import { History, Plus, Play, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useVisualizationSync } from '@/hooks/useVisualizationSync';
import { bookExchangeGraph } from '@/lib/graphDataStructure';
import { requestQueue } from '@/lib/queueDataStructure';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  generateHashTableDemo, 
  generateAVLTreeDemo, 
  generateTrieDemo, 
  generateGraphDemo, 
  generateQueueDemo 
} from '@/lib/sampleVisualizations';

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
  const [currentView, setCurrentView] = useState('hash');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { toast } = useToast();

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
    
    // Load pending requests into queue
    const loadQueueData = async () => {
      try {
        const { data: pendingRequests } = await supabase
          .from('book_requests')
          .select(`
            id,
            book_id,
            created_at,
            status,
            books!inner(title),
            profiles!book_requests_requester_user_id_fkey(full_name)
          `)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true });

        if (pendingRequests && pendingRequests.length > 0) {
          requestQueue.clear();
          pendingRequests.forEach((req: any) => {
            requestQueue.enqueue({
              requestId: req.id,
              bookId: req.book_id,
              bookTitle: req.books?.title || 'Unknown',
              requester_name: req.profiles?.full_name || 'Unknown',
              timestamp: new Date(req.created_at).getTime(),
            }, 1);
          });
          setQueueItems(requestQueue.getItems());
        }
      } catch (error) {
        console.error('Error loading queue data:', error);
      }
    };
    
    loadQueueData();
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
      setIsDemoMode(false);
    }
  };

  const runDemo = async () => {
    setIsDemoMode(true);
    toast({
      title: "Running Demo",
      description: `Loading ${currentView === 'hash' ? 'Hash Table' : currentView === 'avl' ? 'AVL Tree' : currentView === 'trie' ? 'Trie Search' : currentView === 'graph' ? 'Graph' : 'Queue'} demo visualization...`
    });

    let demoEvents: any[] = [];
    let metadata: any = {};
    let operationType: any = 'ADD';

    try {
      switch(currentView) {
        case 'hash':
          demoEvents = await generateHashTableDemo();
          metadata = { description: 'Hash Table demo - Inserting sample books' };
          operationType = 'ADD';
          break;
        case 'avl':
          demoEvents = await generateAVLTreeDemo();
          metadata = { description: 'AVL Tree demo - Tree balancing operations' };
          operationType = 'ADD';
          break;
        case 'trie':
          demoEvents = await generateTrieDemo();
          metadata = { description: 'Trie Search demo - Prefix matching' };
          operationType = 'SEARCH';
          break;
        case 'graph':
          demoEvents = await generateGraphDemo();
          metadata = { description: 'Matching Graph demo - BFS traversal' };
          operationType = 'MATCH';
          break;
        case 'queue':
          demoEvents = await generateQueueDemo();
          metadata = { description: 'Request Queue demo - FIFO operations' };
          operationType = 'ADD';
          break;
      }

      visualizationEngine.setEvents(demoEvents as any, {
        type: operationType,
        timestamp: Date.now(),
        eventsCount: demoEvents.length,
        ...metadata
      });
      visualizationEngine.play();
    } catch (error) {
      console.error('Demo generation error:', error);
      toast({
        title: "Demo Error",
        description: "Failed to generate demo visualization",
        variant: "destructive"
      });
      setIsDemoMode(false);
    }
  };

  const eventsUpToCurrent = visualizationEngine.getEventsUpToCurrent();

  return (
    <div className="h-screen flex bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">Data Structure Visualizer</h1>
              <p className="text-sm text-muted-foreground">
                Watch data structures in action - Real-time step-by-step animations
              </p>
            </div>
            {isDemoMode && (
              <Badge variant="secondary" className="animate-pulse">
                <Sparkles className="w-3 h-3 mr-1" />
                Demo Mode
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runDemo}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Run Demo
            </Button>
            <Select value={currentView} onValueChange={setCurrentView}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hash">Hash Table</SelectItem>
                <SelectItem value="avl">AVL Tree</SelectItem>
                <SelectItem value="graph">Matching Graph</SelectItem>
                <SelectItem value="trie">Trie Search</SelectItem>
                <SelectItem value="queue">Request Queue</SelectItem>
                <SelectItem value="split">Split View</SelectItem>
              </SelectContent>
            </Select>
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
          {currentView === 'hash' && (
            <div className="flex-1 overflow-hidden">
              <HashTableView
                events={eventsUpToCurrent}
                buckets={hashBuckets}
              />
            </div>
          )}

          {currentView === 'avl' && (
            <div className="flex-1 overflow-hidden">
              <AVLTreeView
                events={eventsUpToCurrent}
                root={avlRoot}
              />
            </div>
          )}

          {currentView === 'graph' && (
            <div className="flex-1 overflow-auto">
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
            </div>
          )}

          {currentView === 'trie' && (
            <div className="flex-1 overflow-auto">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border-b">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Trie Search:</strong> Visualizes character-by-character prefix matching for autocomplete. 
                Try searching on the <strong>Search</strong> page to see this in action!
              </p>
            </div>
              <TrieView events={eventsUpToCurrent} />
            </div>
          )}

          {currentView === 'queue' && (
            <div className="flex-1 overflow-auto">
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
            </div>
          )}

          {currentView === 'split' && (
            <div className="flex-1 grid grid-cols-2 gap-4 p-4">
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
            </div>
          )}

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
